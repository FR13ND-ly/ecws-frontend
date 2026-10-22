import { InjectionToken } from '@angular/core';
import { getDatabase, onValue, ref, update } from 'firebase/database';

export interface Horoscope {
  id: string;
  text: string;
  published: boolean;
}

export type HoroscopeRecords = Record<string, Omit<Horoscope, 'id'>>;

export interface HoroscopeSource {
  listen(next: (records: HoroscopeRecords | null) => void): () => void;
  save(horoscope: Horoscope): Promise<void>;
}

export const HOROSCOPE_SOURCE = new InjectionToken<HoroscopeSource>('Horoscope source', {
  providedIn: 'root',
  factory: () => {
    const db = getDatabase();
    return {
      listen: next => onValue(ref(db, 'horoscope'), snapshot => next(snapshot.val())),
      save: horoscope => update(ref(db, `horoscope/${horoscope.id}`), {
        text: horoscope.text,
        published: horoscope.published
      })
    };
  }
});
