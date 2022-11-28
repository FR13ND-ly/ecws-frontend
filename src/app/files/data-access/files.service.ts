import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getDatabase, onValue, push, ref, remove, update } from 'firebase/database';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(private http : HttpClient) { }

  readonly APIUrl = environment.apiURL + "files/"

  private filesUpdated = new BehaviorSubject<[]>([])

  private db = getDatabase();

  init() {
    onValue(ref(this.db, 'files'), (snapshot : any) => {
      let filesRaw = snapshot.val()
      if (filesRaw) {
        let files : any = Object.entries(filesRaw).map((file : any) => {
          file[1].fireId = file[0]
          file[1].pdf = file[1].imageUrl.slice(-3) == 'pdf'
          return file[1]
        })
        this.filesUpdated.next(files.reverse())
      }
      else this.filesUpdated.next([])
    })
  }

  getFilesUpdateListener() {
    return this.filesUpdated.asObservable()
  }

  uploadFile(val : any) {
    this.http.post(this.APIUrl + 'uploadFile/', val).subscribe((res : any) => {
      push(ref(this.db, 'files'), res)
    })
  }

  deleteFile(val : any) {
    this.http.get(`${this.APIUrl}removeFile/${val.id}/`).subscribe((res : any) => {
      remove(ref(this.db, `files/${val.fireId}`))
    })
  }
}
