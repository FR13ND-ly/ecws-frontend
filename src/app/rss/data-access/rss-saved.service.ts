import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RssItem } from './rss.service';

export interface SavedRssItem extends RssItem {
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RssSavedService {
  private readonly storageKey = 'ecws.rss.saved.v1';
  private readonly saved = new BehaviorSubject<SavedRssItem[]>(this.read());
  readonly saved$ = this.saved.asObservable();

  isSaved(item: RssItem): boolean {
    const key = this.itemKey(item);
    return this.saved.value.some((saved) => this.itemKey(saved) === key);
  }

  toggle(item: RssItem): boolean {
    const key = this.itemKey(item);
    const existing = this.saved.value.some((saved) => this.itemKey(saved) === key);
    const next = existing
      ? this.saved.value.filter((saved) => this.itemKey(saved) !== key)
      : [{ ...item, savedAt: new Date().toISOString() }, ...this.saved.value].slice(0, 75);
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    this.saved.next(next);
    return !existing;
  }

  private itemKey(item: RssItem): string {
    return item.id > 0 ? `rss:${item.id}` : `url:${item.url}`;
  }

  private read(): SavedRssItem[] {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}
