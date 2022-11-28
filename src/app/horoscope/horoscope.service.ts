import { Injectable } from '@angular/core';
import { getDatabase, onValue, push, ref, update } from 'firebase/database';
import { Subject, map } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class HoroscopeService {

  private horoscopeUpdated = new Subject<[][]>()
  private db = getDatabase();

  constructor() { }

  init() {
    onValue(ref(this.db, 'horoscope'), (snapshot) => {
      this.horoscopeUpdated.next(snapshot.val())
    })
  }

  getHoroscopeUpdateListener() {
    return this.horoscopeUpdated.asObservable().pipe(
      map((res : any) : any => {
        return Object.entries(res).map((el : any) => {
          el[1].id = el[0]
          return el[1]
      })[0]
    }))
  }

  async onUpdate(horoscope : any) {
    await update(ref(this.db, `horoscope/${horoscope.id}`), horoscope)
  }
}
