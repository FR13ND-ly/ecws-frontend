import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Article, ArticlesService } from '../../articles/data-access/articles.service';

@Component({
  selector: 'app-archive-article-dialog',
  templateUrl: './archive-article-dialog.component.html',
  styleUrls: ['./archive-article-dialog.component.scss']
})
export class ArchiveArticleDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) readonly article: Article,
    private dialogRef: DialogRef,
    private articlesService: ArticlesService,
    private snackbar: MatSnackBar
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  copyJson(): void {
    navigator.clipboard.writeText(JSON.stringify(this.article, null, 2)).then(() => {
      this.snackbar.open('JSON copiat', '', { duration: 2200 });
    });
  }

  restore(): void {
    if (this.article.id == null) return;
    this.articlesService.restoreArticle(this.article.id).subscribe({
      next: () => {
        this.snackbar.open('Articolul a fost restaurat', '', { duration: 3000 });
        this.dialogRef.close();
      },
      error: (error) => console.error('Article restore failed', error)
    });
  }

  isPdf(file: string): boolean {
    return file.split('?')[0].toLowerCase().endsWith('.pdf');
  }
}
