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
  imageUrl: string;
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

  importUrl(url: string): Observable<RssItem> {
    return this.http.post<RssItem>(this.apiUrl + 'import-url/', { url });
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
  const summary = plainRssText(item.summary);
  return {
    source: {
      publisher: item.sourceName,
      url: item.url,
      publishedAt: item.publishedAt || null
    },
    slug: '',
    title: plainRssText(item.title),
    subtitle: '',
    lead: summary,
    secondaryCategories: [],
    tags: [],
    isFeatured: false,
    isBreaking: false,
    heroType: 'standard',
    body: text ? [{ type: 'text', content: `<p>${escapeHtml(text)}</p>` }] : [],
    metaTitle: '',
    metaDescription: summary,
    series: [],
    remoteImages: item.imageUrl ? [{
      url: item.imageUrl,
      placement: 'cover',
      altText: plainRssText(item.title),
      caption: `Sursa imaginii: ${item.sourceName}`
    }] : []
  };
}

export function rssItemToAiClipboard(item: RssItem): string {
  const json = JSON.stringify(rssItemToArticleJson(item), null, 2);
  return `${json}\n\n--- PROMPT PENTRU AI ---\n${ARTICLE_ADAPTATION_PROMPT}`;
}

const ARTICLE_ADAPTATION_PROMPT = `Adaptează materialul de mai sus într-un articol gata de importat în editorul Est-Curier.
Returnează exclusiv un singur obiect JSON valid, fără bloc Markdown, explicații sau text înainte și după JSON.
Păstrează obiectul source și lista remoteImages, inclusiv URL-urile și placement, pentru ca Est-Curier să descarce automat imaginile.
Nu inventa fapte, citate, persoane, cifre sau contexte. Reformulează jurnalistic în limba română și păstrează atribuirea clară către sursa originală.
Completează slug, title, subtitle, lead, tags, body, metaTitle și metaDescription. body trebuie să fie o listă de blocuri acceptate, în principal {"type":"text","content":"<p>...</p>"}.
Elimină meniuri, recomandări, texte promoționale și fragmente fără legătură cu articolul. Nu include status sau authorId; acestea rămân controlate de redactor.`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n+/g, '</p><p>');
}
