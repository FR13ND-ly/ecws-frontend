import { Component, OnInit } from '@angular/core';
import { HoroscopeService } from './horoscope.service';
import { Observable, tap } from 'rxjs'

@Component({
  selector: 'app-horoscope',
  templateUrl: './horoscope.component.html',
  styleUrls: ['./horoscope.component.scss']
})
export class HoroscopeComponent implements OnInit {
  
  constructor(private horoscopeService : HoroscopeService) { }

  horoscope$ : Observable<any> = this.horoscopeService.getHoroscopeUpdateListener()

  ngOnInit() {
    this.horoscopeService.init()
  }

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
