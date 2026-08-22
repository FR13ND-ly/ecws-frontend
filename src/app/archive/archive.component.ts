import { Component, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { Article, ArticlesService } from '../articles/data-access/articles.service';
import { ArchiveArticleDialogComponent } from './archive-article-dialog/archive-article-dialog.component';
import { ArchiveSearchDialogComponent } from './archive-search-dialog/archive-search-dialog.component';

interface ArchiveWeek {
  key: string;
  label: string;
  articles: Article[];
}

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {
  readonly search = new FormControl('', { nonNullable: true });
  readonly filteredArticles$ = combineLatest([
    this.articlesService.getArchiveUpdateListener(),
    this.search.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([articles, search]) => articles.filter((article) => this.matches(article, search)))
  );
  readonly weeks$ = this.filteredArticles$.pipe(map((articles) => this.groupByWeek(articles)));

  constructor(
    private articlesService: ArticlesService,
    private dialog: Dialog,
    private matDialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.articlesService.init();
  }

  openArticle(article: Article): void {
    this.dialog.open(ArchiveArticleDialogComponent, { data: article });
  }

  openSearch(): void {
    this.matDialog.open(ArchiveSearchDialogComponent, {
      data: this.search,
      width: 'min(92vw, 560px)',
      autoFocus: 'input'
    });
  }

  clearSearch(): void {
    this.search.setValue('');
  }

  restore(article: Article, event?: Event): void {
    event?.stopPropagation();
    if (article.id == null) return;
    this.articlesService.restoreArticle(article.id).subscribe({
      next: () => this.snackbar.open('Articolul a fost restaurat', '', { duration: 3000 }),
      error: (error) => console.error('Article restore failed', error)
    });
  }

  copyJson(article: Article, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(article, null, 2)).then(() => {
      this.snackbar.open('JSON copiat', '', { duration: 2200 });
    });
  }

  private matches(article: Article, rawSearch: string): boolean {
    const search = this.normalize(rawSearch);
    if (!search) return true;
    const haystack = this.normalize(`${article.title} ${article.text} ${article.details} ${article.page}`);
    return haystack.includes(search);
  }

  private normalize(value: string | number): string {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private groupByWeek(articles: Article[]): ArchiveWeek[] {
    const groups = new Map<string, ArchiveWeek>();
    articles.forEach((article) => {
      const parsed = new Date(article.archivedAt ?? article.createdAt ?? Date.now());
      const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      const start = new Date(date);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const key = start.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: `${start.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          articles: []
        });
      }
      groups.get(key)?.articles.push(article);
    });
    return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
  }
}
