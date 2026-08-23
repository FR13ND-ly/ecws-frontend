import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, defer, finalize, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface FileRecord {
  id: number;
  imageUrl: string;
  name: string;
  date: string;
  createdAt: string;
  pdf?: boolean;
  initialSize?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FilesService {
  private readonly apiUrl = environment.apiURL + 'files/';
  private readonly filesUpdated = new BehaviorSubject<FileRecord[]>([]);
  private initialized = false;
  private events?: EventSource;
  private readonly pendingLocalEvents: object[] = [];

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onmessage = (event) => {
      if (event.data !== 'refresh' && !event.data.startsWith('file.')) return;
      if (this.pendingLocalEvents.length) {
        this.pendingLocalEvents.shift();
        return;
      }
      this.reload();
    };
  }

  getFilesUpdateListener(): Observable<FileRecord[]> {
    return this.filesUpdated.asObservable();
  }

  reload(): void {
    this.http.get<FileRecord[]>(this.apiUrl).subscribe({
      next: (files) => this.filesUpdated.next(files.map((file) => ({
        ...file,
        pdf: file.name.toLowerCase().endsWith('.pdf'),
        initialSize: false
      }))),
      error: (error) => console.error('Files could not be loaded', error)
    });
  }

  uploadFile(value: FormData): Observable<FileRecord> {
    return this.localMutation(
      this.http.post<FileRecord>(this.apiUrl + 'uploadFile/', value).pipe(
        tap((file) => this.upsertFile(file))
      )
    );
  }

  uploadFileWithProgress(value: FormData): Observable<HttpEvent<FileRecord>> {
    return this.localMutation(
      this.http.post<FileRecord>(this.apiUrl + 'uploadFile/', value, {
        observe: 'events',
        reportProgress: true
      }).pipe(
        tap((event) => {
          if (event.type === HttpEventType.Response && event.body) this.upsertFile(event.body);
        })
      )
    );
  }

  deleteFile(value: FileRecord): Observable<unknown> {
    return this.localMutation(
      this.http.delete(`${this.apiUrl}removeFile/${value.id}/`).pipe(
        tap(() => this.filesUpdated.next(this.filesUpdated.value.filter((file) => file.id !== value.id)))
      )
    );
  }

  private localMutation<T>(request: Observable<T>): Observable<T> {
    return defer(() => {
      const token = {};
      this.pendingLocalEvents.push(token);
      return request.pipe(
        finalize(() => window.setTimeout(() => this.removePendingEvent(token), 1500))
      );
    });
  }

  private removePendingEvent(token: object): void {
    const index = this.pendingLocalEvents.indexOf(token);
    if (index >= 0) this.pendingLocalEvents.splice(index, 1);
  }

  private upsertFile(file: FileRecord): void {
    const normalized = {
      ...file,
      pdf: file.name.toLowerCase().endsWith('.pdf'),
      initialSize: false
    };
    this.filesUpdated.next([
      normalized,
      ...this.filesUpdated.value.filter((existing) => existing.id !== file.id)
    ]);
  }
}
