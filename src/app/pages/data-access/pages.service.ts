import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly apiUrl = environment.apiURL + 'pages/';
  private readonly pagesUpdated = new BehaviorSubject<string[]>([]);
  private initialized = false;
  private events?: EventSource;

  readonly updated$ = new BehaviorSubject(
    localStorage.getItem('pagesUpdated') === 'true'
  );

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onopen = () => this.reload();
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('pages.')) {
        this.reload();
        this.setUpdated(true);
      }
    };
  }

  getPagesUpdateListener(): Observable<string[]> {
    return this.pagesUpdated.asObservable();
  }

  setPages(value: FormData): Observable<string[]> {
    return this.http.post<string[]>(this.apiUrl + 'setPages/', value).pipe(
      tap((pages) => this.pagesUpdated.next(pages))
    );
  }

  setUpdated(value: boolean): void {
    this.updated$.next(value);
    localStorage.setItem('pagesUpdated', value.toString());
  }

  private reload(): void {
    this.http.get<{ pages: string[] }>(this.apiUrl + 'getPages/').subscribe({
      next: ({ pages }) => this.pagesUpdated.next(pages),
      error: (error) => console.error('Pages could not be loaded', error)
    });
  }
}
