import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onopen = () => this.reload();
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('file.')) this.reload();
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
    return this.http.post<FileRecord>(this.apiUrl + 'uploadFile/', value).pipe(
      tap(() => this.reload())
    );
  }

  uploadFileWithProgress(value: FormData): Observable<HttpEvent<FileRecord>> {
    return this.http.post<FileRecord>(this.apiUrl + 'uploadFile/', value, {
      observe: 'events',
      reportProgress: true
    }).pipe(
      tap((event) => {
        if (event.type === HttpEventType.Response) this.reload();
      })
    );
  }

  deleteFile(value: FileRecord): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}removeFile/${value.id}/`).pipe(
      tap(() => this.reload())
    );
  }
}
