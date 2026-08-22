import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-archive-search-dialog',
  templateUrl: './archive-search-dialog.component.html',
  styleUrls: ['./archive-search-dialog.component.scss']
})
export class ArchiveSearchDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly search: FormControl<string>,
    private dialogRef: MatDialogRef<ArchiveSearchDialogComponent>
  ) {}

  clear(): void {
    this.search.setValue('');
  }

  close(): void {
    this.dialogRef.close();
  }
}
