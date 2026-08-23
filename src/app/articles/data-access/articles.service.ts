import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get, getDatabase, ref } from 'firebase/database';
import { BehaviorSubject, Observable, catchError, defer, finalize, forkJoin, from, map, of, switchMap, tap, throwError } from 'rxjs';
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
  private readonly pendingLocalEvents: object[] = [];

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
    this.emitActiveArticles();
    this.localMutation(this.http.post(this.apiUrl + 'reorder/', data)).subscribe({
      error: (error) => console.error('Article order could not be saved', error)
    });
  }

  addNewArticle(article: Article): Observable<Article> {
    const payload = {
      ...article,
      page: Number(article.page),
      col: Number(article.col),
      position: this.articles[Number(article.col) - 1]?.length ?? 0
    };
    return this.localMutation(this.http.post<Article>(this.apiUrl, payload), (created) => {
      this.upsertActiveArticle(created);
    });
  }

  archiveArticle(id: number): Observable<unknown> {
    const article = this.articles.flat().find((item) => item.id === id);
    return this.localMutation(this.http.post(`${this.apiUrl}${id}/archive/`, {}), () => {
      if (!article) return;
      this.removeActiveArticle(id);
      this.archiveUpdated.next([
        { ...article, archivedAt: new Date().toISOString() },
        ...this.archiveUpdated.value.filter((item) => item.id !== id)
      ]);
    });
  }

  restoreArticle(id: number): Observable<unknown> {
    const article = this.archiveUpdated.value.find((item) => item.id === id);
    return this.localMutation(this.http.post(`${this.apiUrl}${id}/restore/`, {}), () => {
      if (!article) return;
      this.archiveUpdated.next(this.archiveUpdated.value.filter((item) => item.id !== id));
      this.upsertActiveArticle({
        ...article,
        col: 4,
        position: this.articles[3].length,
        archivedAt: null
      });
    });
  }

  updateArticle(article: Article): Observable<Article> {
    return this.localMutation(
      this.http.put<Article>(`${this.apiUrl}${article.id}/`, article),
      (updated) => this.upsertActiveArticle(updated)
    );
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
    return this.localMutation(this.http.post(this.apiUrl + 'next-edition/', {}), () => this.reload());
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
    this.events.onmessage = (event) => {
      if (event.data !== 'refresh' && !event.data.startsWith('article.')) return;
      if (this.pendingLocalEvents.length) {
        this.pendingLocalEvents.shift();
        return;
      }
      this.reload();
    };
    this.events.onerror = () => {
      // EventSource reconnects automatically. Existing content remains usable.
    };
  }

  private localMutation<T>(request: Observable<T>, apply?: (result: T) => void): Observable<T> {
    return defer(() => {
      const token = {};
      this.pendingLocalEvents.push(token);
      return request.pipe(
        tap((result) => apply?.(result)),
        catchError((error) => {
          this.removePendingEvent(token);
          this.reload();
          return throwError(() => error);
        }),
        finalize(() => window.setTimeout(() => this.removePendingEvent(token), 1500))
      );
    });
  }

  private removePendingEvent(token: object): void {
    const index = this.pendingLocalEvents.indexOf(token);
    if (index >= 0) this.pendingLocalEvents.splice(index, 1);
  }

  private upsertActiveArticle(article: Article): void {
    this.removeActiveArticle(article.id);
    const column = this.articles[article.col - 1];
    if (!column) return;
    column.push(article);
    this.emitActiveArticles();
  }

  private removeActiveArticle(id?: number): void {
    if (id == null) return;
    this.articles = this.articles.map((column) => column.filter((article) => article.id !== id));
    this.emitActiveArticles();
  }

  private emitActiveArticles(): void {
    this.articles.forEach((column, columnIndex) => column.forEach((article, position) => {
      article.col = columnIndex + 1;
      article.position = position;
    }));
    this.articlesUpdated.next(this.articles.map((column) => [...column]));
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
