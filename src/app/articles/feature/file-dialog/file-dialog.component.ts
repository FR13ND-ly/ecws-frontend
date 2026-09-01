import { DialogRef } from '@angular/cdk/dialog';
import { HttpEventType } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, filter, finalize, forkJoin, map, take, tap } from 'rxjs';
import { FileRecord, FilesService } from 'src/app/files/data-access/files.service';

@Component({
  selector: 'app-file-dialog',
  templateUrl: './file-dialog.component.html',
  styleUrls: ['./file-dialog.component.scss']
})
export class FileDialogComponent {

  constructor(
    private dialogRef: DialogRef<string | undefined>,
    private filesService: FilesService,
    private snackbar: MatSnackBar
  ) {}

  pdfImageUrl = "https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png"

  files$: Observable<FileRecord[]> = this.filesService.getFilesUpdateListener();

  selected?: number;
  dragging = false;
  uploading = false;
  uploadProgress = 0;
  uploadCount = 0;

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const directFiles = Array.from(event.clipboardData?.files ?? []);
    const itemFiles = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => !!file);
    const files = directFiles.length ? directFiles : itemFiles;
    if (!files.length) return;
    event.preventDefault();
    this.uploadFiles(files);
  }

  onUploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.uploading) this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    if (!event.currentTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.dragging = false;
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    this.uploadFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onSelect(id: number): void {
    this.selected = this.selected === id ? undefined : id;
  }

  close(): void {
    this.dialogRef.close();
  }

  choose(imageUrl: string): void {
    this.dialogRef.close(imageUrl);
  }

  private uploadFiles(files: File[]): void {
    if (!files.length || this.uploading) return;
    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadCount = files.length;
    const progress = files.map(() => 0);
    const uploads = files.map((file, index) => {
      const formData = new FormData();
      formData.append('file', file, file.name);
      return this.filesService.uploadFileWithProgress(formData).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            progress[index] = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          } else if (event.type === HttpEventType.Response) {
            progress[index] = 100;
          } else {
            return;
          }
          this.uploadProgress = Math.round(progress.reduce((sum, value) => sum + value, 0) / files.length);
        }),
        filter((event) => event.type === HttpEventType.Response),
        map((event) => event.type === HttpEventType.Response ? event.body : null),
        filter((file): file is FileRecord => !!file),
        take(1)
      );
    });

    forkJoin(uploads).pipe(finalize(() => {
      this.uploading = false;
      this.uploadProgress = 0;
      this.uploadCount = 0;
    })).subscribe({
      next: (uploaded) => {
        this.snackbar.open(
          files.length === 1 ? 'Imaginea a fost încărcată și atașată' : `${files.length} fișiere au fost încărcate`,
          '',
          { duration: 3000 }
        );
        if (uploaded.length === 1) this.dialogRef.close(uploaded[0].imageUrl);
      },
      error: (error) => {
        console.error('File upload failed', error);
        this.snackbar.open('Fișierele nu au putut fi încărcate', 'Închide', { duration: 6000 });
      }
    });
  }
}
