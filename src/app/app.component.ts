import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  constructor(private store: Store<any>) {}

  title = 'ecws';

  loading$ : Observable<any> = this.store.select('loading')

  selectedIndex : number = 0

  ngOnInit() {
    this.onSetTheme();
    if (location.hash == "#pagini") {
      this.selectedIndex = 1
    }
    else if (location.hash == "#fisiere") {
      this.selectedIndex = 2
    }
    else if (location.hash == "#avize") {
      this.selectedIndex = 3
    }
    else if (location.hash == "#horoscop") {
      this.selectedIndex = 4
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
