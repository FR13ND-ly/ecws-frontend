import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { RssService, RssSource } from '../data-access/rss.service';

@Component({ selector: 'app-rss-sources-dialog', templateUrl: './rss-sources-dialog.component.html', styleUrls: ['./rss-sources-dialog.component.scss'] })
export class RssSourcesDialogComponent {
  readonly sources$ = this.rssService.getSources();
  readonly name = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly url = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^https?:\/\//i)] });
  saving = false;

  constructor(private rssService: RssService, private dialogRef: MatDialogRef<RssSourcesDialogComponent>, private snackbar: MatSnackBar) {}

  add(): void {
    if (this.name.invalid || this.url.invalid || this.saving) return;
    this.saving = true;
    this.rssService.addSource({ name: this.name.value.trim(), url: this.url.value.trim() }).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.name.setValue(''); this.url.setValue(''); this.snackbar.open('Sursa RSS a fost adăugată', '', { duration: 2500 }); },
      error: (error) => this.snackbar.open(error.error?.error || 'Sursa nu a putut fi adăugată', 'Închide', { duration: 5000 })
    });
  }
  remove(source: RssSource): void {
    if (!confirm(`Elimini sursa „${source.name}” și știrile colectate din ea?`)) return;
    this.rssService.deleteSource(source.id).subscribe({ error: () => this.snackbar.open('Sursa nu a putut fi eliminată', 'Închide', { duration: 5000 }) });
  }
  close(): void { this.dialogRef.close(); }
}
