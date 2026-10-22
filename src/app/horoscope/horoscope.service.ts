import { Injectable } from '@angular/core';
import { getDatabase, onValue, ref, update } from 'firebase/database';
import { ReplaySubject, map } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class HoroscopeService {

  private horoscopeUpdated = new ReplaySubject<Record<string, any> | null>(1)
  private db = getDatabase();

  constructor() { }

  init() {
    onValue(ref(this.db, 'horoscope'), (snapshot) => {
      this.horoscopeUpdated.next(snapshot.val())
    })
  }

  getHoroscopeUpdateListener() {
    return this.horoscopeUpdated.asObservable().pipe(
      map(res => {
        const entry = Object.entries(res ?? {})[0]
        return entry ? { ...entry[1], id: entry[0] } : null
      }))
  }

  async onUpdate(horoscope : any) {
    await update(ref(this.db, `horoscope/${horoscope.id}`), horoscope)
  }
}
