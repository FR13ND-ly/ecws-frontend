import { Inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HOROSCOPE_SOURCE, Horoscope, HoroscopeSource } from './horoscope.source';

@Injectable({
  providedIn: 'root'
})
export class HoroscopeService implements OnDestroy {

  private readonly horoscopeUpdated = new BehaviorSubject<Horoscope | null>(null);
  private stopListening?: () => void;
  private updateVersion = 0;

  constructor(@Inject(HOROSCOPE_SOURCE) private source: HoroscopeSource, private zone: NgZone) {}

  init() {
    if (this.stopListening) return;
    this.stopListening = this.source.listen(records => {
      const entry = Object.entries(records ?? {})[0];
      const horoscope = entry ? { ...entry[1], id: entry[0] } : null;
      this.zone.run(() => this.horoscopeUpdated.next(horoscope));
    });
  }

  getHoroscopeUpdateListener() {
    return this.horoscopeUpdated.asObservable();
  }

  async onUpdate(horoscope: Horoscope) {
    const previous = this.horoscopeUpdated.value;
    const version = ++this.updateVersion;
    this.zone.run(() => this.horoscopeUpdated.next({ ...horoscope }));
    try {
      await this.source.save(horoscope);
    } catch (error) {
      if (version === this.updateVersion) {
        this.zone.run(() => this.horoscopeUpdated.next(previous));
      }
      throw error;
    }
  }

  ngOnDestroy() {
    this.stopListening?.();
  }
}
