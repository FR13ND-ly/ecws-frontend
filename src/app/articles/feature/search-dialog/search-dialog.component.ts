import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { distinctUntilChanged, map, take } from 'rxjs';
import { setSearchText } from 'src/app/state/search-text/search-text.actions';

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.scss']
})
export class SearchDialogComponent implements OnInit {

  constructor(private store : Store<any>, private dialogRef: MatDialogRef<SearchDialogComponent>) { }

  searchText = new FormControl('', { nonNullable: true });

  ngOnInit() {
    this.store.select('searchText').pipe(take(1)).subscribe((text) => {
      this.searchText.setValue(text ?? '', { emitEvent: false })
    })
    this.searchText.valueChanges.pipe(
      map((value) => value.trim()),
      distinctUntilChanged()
    ).subscribe((res) => this.store.dispatch(setSearchText({text : res})))
  }

  clear() {
    this.searchText.setValue('')
  }

  close() {
    this.dialogRef.close()
  }
}

