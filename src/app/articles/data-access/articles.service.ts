import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get, getDatabase, ref } from 'firebase/database';
import { BehaviorSubject, Observable, catchError, forkJoin, from, map, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Article {
  id?: number;
  firebaseId?: string;
  title: string;
  text: string;
  details: string;
  page: number;
  col: number;
  position: number;
  files: string[];
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly apiUrl = environment.apiURL + 'articles/';
  private readonly migrationUrl = environment.apiURL + 'migration/firebase/';
  private readonly articlesUpdated = new BehaviorSubject<Article[][]>([[], [], [], []]);
  private readonly archiveUpdated = new BehaviorSubject<Article[]>([]);
  private initialized = false;
  private events?: EventSource;

  articles: Article[][] = [[], [], [], []];

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.ensureFirebaseMigration().subscribe({
      next: () => {
        this.reload();
        this.connectRealtime();
      },
      error: (error) => console.error('Article initialization failed', error)
    });
  }

  getArticlesUpdateListener(): Observable<Article[][]> {
    return this.articlesUpdated.asObservable();
  }

  getArchiveUpdateListener(): Observable<Article[]> {
    return this.archiveUpdated.asObservable();
  }

  reload(): void {
    forkJoin({
      active: this.http.get<Article[]>(this.apiUrl),
      archived: this.http.get<Article[]>(this.apiUrl, {
        params: new HttpParams().set('archived', true)
      })
    }).subscribe({
      next: ({ active, archived }) => {
        this.articles = this.resolveArticles(active);
        this.articlesUpdated.next(this.articles);
        this.archiveUpdated.next(archived);
      },
      error: (error) => console.error('Articles could not be loaded', error)
    });
  }

  changeCol(data: { col: number; order: number[] }): void {
    this.http.post(this.apiUrl + 'reorder/', data).subscribe({
      error: (error) => console.error('Article order could not be saved', error)
    });
  }

  addNewArticle(article: Article): Observable<Article> {
    article.position = this.articles[article.col - 1]?.length ?? 0;
    return this.http.post<Article>(this.apiUrl, article);
  }

  archiveArticle(id: number): Observable<unknown> {
    return this.http.post(`${this.apiUrl}${id}/archive/`, {});
  }

  restoreArticle(id: number): Observable<unknown> {
    return this.http.post(`${this.apiUrl}${id}/restore/`, {});
  }

  updateArticle(article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}${article.id}/`, article);
  }

  changeToSecondCol(id: number): Observable<Article> {
    const article = this.articles.flat().find((item) => item.id === id);
    if (!article) throw new Error('Article not found');
    return this.updateArticle({
      ...article,
      col: 2,
      position: this.articles[1].length
    });
  }

  changeEdition(): Observable<unknown> {
    return this.http.post(this.apiUrl + 'next-edition/', {});
  }

  private resolveArticles(items: Article[]): Article[][] {
    const lists: Article[][] = [[], [], [], []];
    items.forEach((article) => {
      if (article.col >= 1 && article.col <= 4) lists[article.col - 1].push(article);
    });
    lists.forEach((list) => list.sort((a, b) => a.position - b.position));
    return lists;
  }

  private connectRealtime(): void {
    this.events?.close();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onopen = () => this.reload();
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('article.')) this.reload();
    };
    this.events.onerror = () => {
      // EventSource reconnects automatically. Existing content remains usable.
    };
  }

  private ensureFirebaseMigration(): Observable<unknown> {
    return this.http.get<{ firebaseArticlesImported: boolean }>(this.migrationUrl).pipe(
      switchMap((status) => {
        if (status.firebaseArticlesImported) return of(status);
        return from(get(ref(getDatabase(), 'articles'))).pipe(
          map((snapshot) => {
            const raw = snapshot.val() ?? {};
            const articles = Object.entries(raw).map(([firebaseId, value]) => ({
              ...(value as Article),
              firebaseId,
              files: (value as Article).files ?? [],
              details: (value as Article).details ?? '',
              position: (value as Article).position ?? 0
            }));
            return { articles };
          }),
          switchMap((payload) => this.http.post(this.migrationUrl, payload))
        );
      }),
      catchError((error) => {
        console.error('Firebase migration failed', error);
        throw error;
      })
    );
  }
}
