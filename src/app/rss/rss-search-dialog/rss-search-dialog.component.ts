import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rss-search-dialog',
  templateUrl: './rss-search-dialog.component.html',
  styleUrls: ['./rss-search-dialog.component.scss']
})
export class RssSearchDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly search: FormControl<string>,
    private dialogRef: MatDialogRef<RssSearchDialogComponent>
  ) {}

  clear(): void { this.search.setValue(''); }
  close(): void { this.dialogRef.close(); }
}
