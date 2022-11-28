import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { setLoading } from '../state/loading/loading.actions';
import { FilesService } from './data-access/files.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {

  constructor(private filesService : FilesService, private store : Store<any>) { }

  pdfImageUrl = "https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png"

  files$ : Observable<any> = this.filesService.getFilesUpdateListener()

  ngOnInit(): void {
    this.filesService.init()
  }

  onDeleteFile(file : any) {
    if (!confirm("Ești sigur?")) return
    this.filesService.deleteFile(file)
  }

  onDownloadFile(file : any) {
    var xhr = new XMLHttpRequest();
      xhr.open("GET", file.imageUrl, true);
      xhr.responseType = "blob";
      xhr.onload = function(){
          var urlCreator = window.URL || window.webkitURL;
          var imageUrl = urlCreator.createObjectURL(this.response);
          var tag = document.createElement('a');
          tag.href = imageUrl;
          tag.download = file.name;
          document.body.appendChild(tag);
          tag.click();
          document.body.removeChild(tag);
      }
      xhr.send();
  }

  onUploadFile(event : any) {
    this.store.dispatch(setLoading({loading: true}))
    let file = event.target.files[0]
    let formData = new FormData()
    formData.append('file', file, file.name)
    this.filesService.uploadFile(formData)
    event.target.value = null
    this.store.dispatch(setLoading({loading: false}))
  }
}
