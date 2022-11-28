import { Injectable } from '@angular/core';
import { getDatabase, onValue, push, ref, remove, update } from 'firebase/database';
import { map, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WidgetsService {

  private widgetsUpdated = new Subject<[][]>()
  private db = getDatabase();

  constructor() { }

  init() {
    onValue(ref(this.db, 'widgets'), (snapshot) => {
      this.widgetsUpdated.next(snapshot.val())
    })
  }

  getWidgetsUpdateListener() {
    return this.widgetsUpdated.asObservable().pipe(
      map((res : any) : any => {
        if (!res) return []
        return Object.entries(res).map((el : any) => {
          el[1].id = el[0]
          return el[1]
      }).reverse()
    }))
  }

  addWidget(widget : any) {
    push(ref(this.db, 'widgets'), widget)
  }

  async onUpdate(widget : any) {
    await update(ref(this.db, `widgets/${widget.id}`), widget)
  }

  delete(widgetId : any) {
    remove(ref(this.db, `widgets/${widgetId}`))
  }
}
