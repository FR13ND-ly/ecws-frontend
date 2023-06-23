import { Component } from '@angular/core';
import { HoroscopeService } from './horoscope.service';
import { BehaviorSubject, Observable, tap } from 'rxjs'

@Component({
  selector: 'app-horoscope',
  templateUrl: './horoscope.component.html',
  styleUrls: ['./horoscope.component.scss']
})
export class HoroscopeComponent {
  
  constructor(private horoscopeService : HoroscopeService) { }

  horoscope$ : Observable<any> = this.horoscopeService.getHoroscopeUpdateListener()

  onChangeHoroscope(horoscope : any, text : any) {
    horoscope.text = text
    this.horoscopeService.onUpdate(horoscope)
  }

  onResolve(horoscope : any) {
    horoscope.published = !horoscope.published
    this.horoscopeService.onUpdate(horoscope)
  }

  onCopy(text : any) {
    navigator.clipboard.writeText(text)
  }
}
