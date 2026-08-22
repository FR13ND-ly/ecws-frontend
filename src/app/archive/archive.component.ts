import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { Article, ArticlesService } from '../articles/data-access/articles.service';

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
  readonly weeks$ = combineLatest([
    this.articlesService.getArchiveUpdateListener(),
    this.search.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([articles, search]) => this.groupByWeek(
      articles.filter((article) => this.matches(article, search))
    ))
  );

  constructor(private articlesService: ArticlesService) {}

  ngOnInit(): void {
    this.articlesService.init();
  }

  restore(article: Article): void {
    if (article.id == null) return;
    this.articlesService.restoreArticle(article.id).subscribe({
      error: (error) => console.error('Article restore failed', error)
    });
  }

  copyJson(article: Article): void {
    navigator.clipboard.writeText(JSON.stringify(article, null, 2));
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
