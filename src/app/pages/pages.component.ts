import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PagesService } from './data-access/pages.service';
import { map, delay, Observable, tap, catchError } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { setLoading } from '../state/loading/loading.actions';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit {

  constructor(private pagesService : PagesService, private snackbar: MatSnackBar, private store : Store) { }

  @ViewChild('fileInputRef') fileInputRef! : ElementRef

  pages$ : Observable<any> = this.pagesService.getPagesUpdateListener()

  ngOnInit(): void {
    this.pagesService.init()
    document.onkeydown = (e) => {
      if (e.ctrlKey && e.key == 'u') {
        e.preventDefault()
        this.fileInputRef.nativeElement.click()
      }
    }
  }

  onSetPages(event : any) {
    this.store.dispatch(setLoading({ loading : true }))
    let file = event.target.files[0]
    let formData = new FormData()
    formData.append('file', file, file.name)
    this.pagesService.setPages(formData).pipe(
      catchError(() : any => {
        this.store.dispatch(setLoading({ loading : false }))
        this.snackbar.open("Ceva a mers greșit", "Închide")
      })
    )
    .subscribe(() => {
      this.store.dispatch(setLoading({ loading : false }))
      this.snackbar.open("Paginile au fost actualizate", "", { duration: 5000 })
    })
    event.target.value = null


    // this.snackbar.open("Paginile au fost actualizate", "", { duration: 5000 })
  }
}
