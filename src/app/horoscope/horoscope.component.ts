import { Component } from '@angular/core';
import { HoroscopeService } from './horoscope.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Horoscope } from './horoscope.source';

@Component({
  selector: 'app-horoscope',
  templateUrl: './horoscope.component.html',
  styleUrls: ['./horoscope.component.scss']
})
export class HoroscopeComponent {
  
  constructor(private horoscopeService: HoroscopeService, private snackBar: MatSnackBar) {}

  horoscope$ = this.horoscopeService.getHoroscopeUpdateListener()

  onChangeHoroscope(horoscope: Horoscope, text: string) {
    this.save({ ...horoscope, text })
  }

  onResolve(horoscope: Horoscope) {
    this.save({ ...horoscope, published: !horoscope.published })
  }

  private save(horoscope: Horoscope) {
    this.horoscopeService.onUpdate(horoscope).catch(() => {
      this.snackBar.open('Horoscopul nu a putut fi salvat. Încearcă din nou.', 'Închide', { duration: 5000 })
    })
  }

  onCopy(text : any) {
    navigator.clipboard.writeText(text)
  }
}
