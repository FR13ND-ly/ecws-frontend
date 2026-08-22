import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RssItem, plainRssText, rssItemToArticleJson } from '../data-access/rss.service';
import { RssSavedService } from '../data-access/rss-saved.service';

@Component({
  selector: 'app-rss-item-dialog',
  templateUrl: './rss-item-dialog.component.html',
  styleUrls: ['./rss-item-dialog.component.scss']
})
export class RssItemDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) readonly item: RssItem,
    private dialogRef: DialogRef,
    private snackbar: MatSnackBar,
    private savedService: RssSavedService
  ) {}

  close(): void { this.dialogRef.close(); }
  text(): string { return plainRssText(this.item.content || this.item.summary) || 'Fluxul nu oferă text pentru această știre.'; }
  date(): string {
    const value = this.item.publishedAt || this.item.fetchedAt;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ro-RO');
  }
  copyJson(): void {
    navigator.clipboard.writeText(JSON.stringify(rssItemToArticleJson(this.item), null, 2)).then(() => {
      this.snackbar.open('JSON compatibil cu editorul a fost copiat', '', { duration: 2800 });
    });
  }

  isSaved(): boolean { return this.savedService.isSaved(this.item); }

  toggleSaved(): void {
    try {
      const saved = this.savedService.toggle(this.item);
      this.snackbar.open(saved ? 'Știrea a fost salvată în acest browser' : 'Știrea a fost eliminată din salvate', '', { duration: 2500 });
    } catch {
      this.snackbar.open('Spațiul local al browserului este plin', 'Închide', { duration: 5000 });
    }
  }
}
