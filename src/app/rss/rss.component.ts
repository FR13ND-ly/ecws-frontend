import { Dialog } from '@angular/cdk/dialog';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, finalize, map, startWith } from 'rxjs';
import { setLoading } from '../state/loading/loading.actions';
import { RssItem, RssService, plainRssText, rssItemToArticleJson } from './data-access/rss.service';
import { RssItemDialogComponent } from './rss-item-dialog/rss-item-dialog.component';
import { RssSearchDialogComponent } from './rss-search-dialog/rss-search-dialog.component';
import { RssSourcesDialogComponent } from './rss-sources-dialog/rss-sources-dialog.component';

@Component({
  selector: 'app-rss',
  templateUrl: './rss.component.html',
  styleUrls: ['./rss.component.scss']
})
export class RssComponent implements OnInit {
  readonly search = new FormControl('', { nonNullable: true });
  readonly selectedSource = new BehaviorSubject<number | null>(null);
  readonly sources$ = this.rssService.getSources();
  readonly items$ = combineLatest([
    this.rssService.getItems(),
    this.search.valueChanges.pipe(startWith(''), map((value) => value.toLowerCase().trim())),
    this.selectedSource
  ]).pipe(map(([items, search, source]) => items.filter((item) => {
    const sourceMatches = source == null || item.sourceId === source;
    const text = `${item.title} ${item.summary} ${item.content} ${item.sourceName}`.toLowerCase();
    return sourceMatches && (!search || plainRssText(text).includes(search));
  })));

  refreshing = false;

  constructor(
    private rssService: RssService,
    private dialog: Dialog,
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.rssService.init();
  }

  refresh(): void {
    if (this.refreshing) return;
    this.refreshing = true;
    this.store.dispatch(setLoading({ loading: true }));
    this.rssService.refresh().pipe(finalize(() => {
      this.refreshing = false;
      this.store.dispatch(setLoading({ loading: false }));
    })).subscribe({
      next: (result) => this.snackbar.open(
        result.errors ? `Actualizat cu ${result.errors} surse indisponibile` : `Flux actualizat · ${result.items} știri procesate`,
        '',
        { duration: 4000 }
      ),
      error: () => this.snackbar.open('Fluxul RSS nu a putut fi actualizat', 'Închide', { duration: 6000 })
    });
  }

  openItem(item: RssItem): void {
    this.dialog.open(RssItemDialogComponent, { data: item });
  }

  openSearch(): void {
    this.matDialog.open(RssSearchDialogComponent, {
      data: this.search,
      width: 'min(92vw, 560px)',
      autoFocus: 'input'
    });
  }

  openSources(): void {
    this.matDialog.open(RssSourcesDialogComponent, { width: 'min(94vw, 720px)' });
  }

  selectSource(id: number | null): void {
    this.selectedSource.next(id);
  }

  sourceLabel(sources: { id: number; name: string }[]): string {
    const id = this.selectedSource.value;
    return id == null ? 'Toate sursele' : sources.find((source) => source.id === id)?.name ?? 'Toate sursele';
  }

  preview(item: RssItem): string {
    return plainRssText(item.summary || item.content) || 'Fluxul nu oferă un rezumat pentru această știre.';
  }

  itemDate(item: RssItem): string {
    const value = item.publishedAt || item.fetchedAt;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ro-RO', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  copyJson(item: RssItem, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(rssItemToArticleJson(item), null, 2)).then(() => {
      this.snackbar.open('Știrea a fost copiată ca JSON pentru editor', '', { duration: 2800 });
    });
  }
}
