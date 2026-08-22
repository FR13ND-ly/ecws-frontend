import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, finalize, forkJoin, map } from 'rxjs';
import { setLoading } from '../state/loading/loading.actions';
import { FileRecord, FilesService } from './data-access/files.service';

interface FileWeek {
  key: string;
  label: string;
  files: FileRecord[];
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent {
  readonly pdfImageUrl = 'https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png';
  dragging = false;

  readonly weeks$: Observable<FileWeek[]> = this.filesService.getFilesUpdateListener().pipe(
    map((files) => this.groupByWeek(files))
  );

  constructor(private filesService: FilesService, private store: Store) {}

  onDeleteFile(file: FileRecord): void {
    if (!confirm(`Ștergi definitiv fișierul „${file.name}”?`)) return;
    this.store.dispatch(setLoading({ loading: true }));
    this.filesService.deleteFile(file).pipe(
      finalize(() => this.store.dispatch(setLoading({ loading: false })))
    ).subscribe({ error: (error) => console.error('File deletion failed', error) });
  }

  onDownloadFile(file: FileRecord): void {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', file.imageUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const objectUrl = URL.createObjectURL(xhr.response);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(objectUrl);
    };
    xhr.send();
  }

  onUploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    this.uploadFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  toggleSize(file: FileRecord): void {
    if (!file.pdf) file.initialSize = !file.initialSize;
  }

  private uploadFiles(files: File[]): void {
    if (!files.length) return;
    this.store.dispatch(setLoading({ loading: true }));
    const uploads = files.map((file) => {
      const formData = new FormData();
      formData.append('file', file, file.name);
      return this.filesService.uploadFile(formData);
    });
    forkJoin(uploads).pipe(
      finalize(() => this.store.dispatch(setLoading({ loading: false })))
    ).subscribe({ error: (error) => console.error('File upload failed', error) });
  }

  private groupByWeek(files: FileRecord[]): FileWeek[] {
    const groups = new Map<string, FileWeek>();
    files.forEach((file) => {
      const parsed = new Date(file.createdAt);
      const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      const start = new Date(date);
      const weekday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - weekday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const key = start.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: `${start.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          files: []
        });
      }
      groups.get(key)?.files.push(file);
    });
    return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
  }
}
