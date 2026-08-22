import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RssSource {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
}

export interface RssItem {
  id: number;
  sourceId: number;
  sourceName: string;
  title: string;
  url: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string | null;
  fetchedAt: string;
}

export interface RssRefreshResult {
  sources: number;
  items: number;
  errors: number;
}

@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly apiUrl = environment.apiURL + 'rss/';
  private readonly items = new BehaviorSubject<RssItem[]>([]);
  private readonly sources = new BehaviorSubject<RssSource[]>([]);
  private initialized = false;
  private events?: EventSource;

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('rss.')) this.reload();
    };
  }

  getItems(): Observable<RssItem[]> {
    return this.items.asObservable();
  }

  getSources(): Observable<RssSource[]> {
    return this.sources.asObservable();
  }

  refresh(): Observable<RssRefreshResult> {
    return this.http.post<RssRefreshResult>(this.apiUrl + 'refresh/', {}).pipe(
      tap(() => this.reload())
    );
  }

  addSource(payload: { name: string; url: string }): Observable<RssSource> {
    return this.http.post<RssSource>(this.apiUrl + 'sources/', payload).pipe(
      tap(() => this.reloadSources())
    );
  }

  deleteSource(id: number): Observable<unknown> {
    return this.http.delete(this.apiUrl + `sources/${id}/`).pipe(
      tap(() => this.reload())
    );
  }

  reload(): void {
    this.reloadItems();
    this.reloadSources();
  }

  private reloadItems(): void {
    this.http.get<RssItem[]>(this.apiUrl + 'items/', { params: { limit: 500 } }).subscribe({
      next: (items) => this.items.next(items),
      error: (error) => console.error('RSS items could not be loaded', error)
    });
  }

  private reloadSources(): void {
    this.http.get<RssSource[]>(this.apiUrl + 'sources/').subscribe({
      next: (sources) => this.sources.next(sources),
      error: (error) => console.error('RSS sources could not be loaded', error)
    });
  }
}

export function plainRssText(value: string): string {
  if (!value) return '';
  const document = new DOMParser().parseFromString(value, 'text/html');
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function rssItemToArticleJson(item: RssItem): Record<string, unknown> {
  const text = plainRssText(item.content || item.summary);
  return {
    title: plainRssText(item.title),
    text,
    details: `Sursă: ${item.sourceName}\nLink original: ${item.url}`,
    page: 1,
    col: 1,
    position: 0,
    files: []
  };
}
