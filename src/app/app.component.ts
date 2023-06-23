import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime, delay, map, Observable, tap } from 'rxjs';
import { FilesService } from './files/data-access/files.service';
import { HoroscopeService } from './horoscope/horoscope.service';
import { PagesService } from './pages/data-access/pages.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  constructor(private store: Store<any>, private horoscopeService: HoroscopeService, private pagesService: PagesService, private filesService: FilesService) {}

  title = 'ecws';

  horoscopeUpdated$ : Observable<any> = this.horoscopeService.getHoroscopeUpdateListener().pipe(
    map(res => !res.published)
  )

  pagesUpdated$ : Observable<any> = this.pagesService.updated$.pipe(
    debounceTime(200),
    tap((res) => {
      if (this.selectedIndex == 1 && res) this.pagesService.setUpdated(false)
    })
  )

  loading$ : Observable<any> = this.store.select('loading')

  selectedIndex : number = 0

  ngOnInit() {
    this.filesService.init()
    this.horoscopeService.init()
    this.onSetTheme();
    if (location.hash == "#pagini") {
      this.selectedIndex = 1
    }
    else if (location.hash == "#fisiere") {
      this.selectedIndex = 2
    }
    else if (location.hash == "#horoscop") {
      this.selectedIndex = 3
    }
  }

  onChangeTheme() {
    localStorage.setItem(
      'theme',
      !localStorage.getItem('theme') ? 'dark-theme' : ''
    );
    this.onSetTheme();
  }

  onSetTheme() {
    document.body.classList.toggle(
      'dark-theme',
      !!localStorage.getItem('theme')
    );
  }

  changeMenu(index: any){
    if (index == 0) {
      location.href = location.origin + '#articole'
    }
    else if (index == 1){
      location.href = location.origin + '#pagini'  
      this.pagesService.setUpdated(false)
    }
    else if (index == 2) {
      location.href = location.origin + '#fisiere'  
    }
    else if (index == 3) {
      location.href = location.origin + '#avize'  
    }
    else if (index == 4) {
      location.href = location.origin + '#horoscop'  
    }
  }
}
