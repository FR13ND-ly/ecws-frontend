import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
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

  loading$ : Observable<any> = this.store.select('loading')

  selectedIndex : number = 0
  readonly sections = [
    { label: 'Articole', icon: 'view_column', hash: '#articole' },
    { label: 'Pagini', icon: 'auto_stories', hash: '#pagini' },
    { label: 'Fișiere', icon: 'folder', hash: '#fisiere' },
    { label: 'Arhivă', icon: 'archive', hash: '#arhiva' },
    { label: 'Horoscop', icon: 'auto_awesome', hash: '#horoscop' },
  ]

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
      this.selectedIndex = 4
    }
    else if (location.hash == "#arhiva") {
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

  selectSection(index: number) {
    this.selectedIndex = index
  }

  changeMenu(index: number){
    const section = this.sections[index]
    if (section) history.replaceState(null, '', section.hash)
  }
}
