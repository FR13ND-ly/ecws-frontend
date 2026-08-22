import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PagesState {
  pages: string[];
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly apiUrl = environment.apiURL + 'pages/';
  private readonly state = new BehaviorSubject<PagesState>({ pages: [], updatedAt: null });
  private initialized = false;
  private events?: EventSource;

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onopen = () => this.reload();
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('pages.')) this.reload();
    };
  }

  getPagesUpdateListener(): Observable<string[]> {
    return this.state.asObservable().pipe(map(({ pages }) => pages));
  }

  getStateListener(): Observable<PagesState> {
    return this.state.asObservable();
  }

  setPages(value: FormData): Observable<string[]> {
    return this.http.post<string[]>(this.apiUrl + 'setPages/', value).pipe(
      tap((pages) => {
        this.state.next({ pages, updatedAt: new Date().toISOString() });
        this.reload();
      })
    );
  }

  private reload(): void {
    this.http.get<PagesState>(this.apiUrl + 'getPages/').subscribe({
      next: (state) => this.state.next(state),
      error: (error) => console.error('Pages could not be loaded', error)
    });
  }
}
