import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';
import { setLoading } from '../state/loading/loading.actions';
import { PagesService } from './data-access/pages.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly state$ = this.pagesService.getStateListener();
  pendingFile: File | null = null;
  dragging = false;
  uploading = false;

  constructor(
    private pagesService: PagesService,
    private snackbar: MatSnackBar,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.pagesService.init();
  }

  @HostListener('document:keydown.control.u', ['$event'])
  openFilePicker(event: KeyboardEvent): void {
    event.preventDefault();
    this.fileInput?.nativeElement.click();
  }

  onSelectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setCandidate(input.files?.[0] ?? null);
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
    this.setCandidate(event.dataTransfer?.files?.[0] ?? null);
  }

  clearSelection(): void {
    if (!this.uploading) this.pendingFile = null;
  }

  uploadSelected(): void {
    if (!this.pendingFile || this.uploading) return;
    const formData = new FormData();
    formData.append('file', this.pendingFile, this.pendingFile.name);
    this.uploading = true;
    this.store.dispatch(setLoading({ loading: true }));

    this.pagesService.setPages(formData).pipe(
      finalize(() => {
        this.uploading = false;
        this.store.dispatch(setLoading({ loading: false }));
      })
    ).subscribe({
      next: () => {
        this.pendingFile = null;
        this.snackbar.open('Ediția PDF a fost actualizată', '', { duration: 3500 });
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.error || 'PDF-ul nu a putut fi procesat';
        this.snackbar.open(message, 'Închide', { duration: 7000 });
      }
    });
  }

  onOpen(page: string): void {
    window.open(page, '_blank', 'noopener');
  }

  fileSize(file: File): string {
    return `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  }

  updatedLabel(value: string | null): string {
    if (!value) return 'Nu există încă o ediție încărcată';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `Actualizată ${date.toLocaleDateString('ro-RO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private setCandidate(file: File | null): void {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.snackbar.open('Selectează un fișier PDF', 'Închide', { duration: 5000 });
      return;
    }
    this.pendingFile = file;
  }
}
