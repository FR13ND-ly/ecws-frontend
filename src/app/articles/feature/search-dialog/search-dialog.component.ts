import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { setSearchText } from 'src/app/state/search-text/search-text.actions';

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.scss']
})
export class SearchDialogComponent implements OnInit {

  constructor(private store : Store<any>) { }

  searchText = new FormControl('');

  ngOnInit() {
    this.searchText.valueChanges.pipe(
      map((res : any) => res?.trim())
    ).subscribe((res) => this.store.dispatch(setSearchText({text : res})))
  }
}

