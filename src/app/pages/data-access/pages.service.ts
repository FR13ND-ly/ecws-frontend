import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getDatabase, onValue, ref, update } from 'firebase/database';
import { map, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class PagesService {

  constructor(private http : HttpClient) { }

  readonly APIUrl = environment.apiURL + "pages/"

  private pagesUpdated = new Subject<[]>()

  updated$ = new BehaviorSubject(
    localStorage.getItem('pagesUpdated') == 'true'
  )

  private db = getDatabase();

  pagesId : any = []

  init() {
    onValue(ref(this.db, 'pages'), (snapshot : any) => {
      this.pagesUpdated.next(snapshot.val())
    })
  }

  getPagesUpdateListener() {
    return this.pagesUpdated.asObservable().pipe(
      tap((res : any) => this.pagesId = Object.keys(res)),
      map((res : any) => Object.values(res).map((res : any) => res.imageUrl))
    )
  }

  setPages(val : any) {
    return this.http.post(this.APIUrl + 'setPages/', val).pipe(
      tap((res : any) => {
        this.pagesId.forEach(async (el : any, i : number) => {
          await update(ref(this.db, `pages/${el}`), { imageUrl : res[i] })
        })
      })
    )
  }

  setUpdated(value: boolean) {
    this.updated$.next(value)
    localStorage.setItem('pagesUpdated', value.toString())
  }
}
