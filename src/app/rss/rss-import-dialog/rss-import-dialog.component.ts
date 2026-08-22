import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { RssItem, RssService } from '../data-access/rss.service';

@Component({
  selector: 'app-rss-import-dialog',
  templateUrl: './rss-import-dialog.component.html',
  styleUrls: ['./rss-import-dialog.component.scss']
})
export class RssImportDialogComponent {
  readonly url = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^https?:\/\//i)]
  });
  loading = false;

  constructor(
    private rssService: RssService,
    private dialogRef: MatDialogRef<RssImportDialogComponent, RssItem>,
    private snackbar: MatSnackBar
  ) {}

  import(): void {
    if (this.url.invalid || this.loading) return;
    this.loading = true;
    this.rssService.importUrl(this.url.value.trim()).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (item) => this.dialogRef.close(item),
      error: (error) => this.snackbar.open(error.error?.error || 'Pagina nu a putut fi importată', 'Închide', { duration: 6000 })
    });
  }

  close(): void { this.dialogRef.close(); }
}
