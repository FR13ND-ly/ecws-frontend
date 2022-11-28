import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { WidgetsService } from './data-access/widgets.service';

@Component({
  selector: 'app-widgets',
  templateUrl: './widgets.component.html',
  styleUrls: ['./widgets.component.scss']
})
export class WidgetsComponent implements OnInit {

  constructor(private widgetsService : WidgetsService) { }

  widgets$ : Observable<any> = this.widgetsService.getWidgetsUpdateListener()

  ngOnInit(): void {
    this.widgetsService.init()
  }

  onAddWidget(form : NgForm) {
    if (!form.value.text.trim()) return
    this.widgetsService.addWidget({
      text : form.value.text,
      resolved : false
    })
    form.reset()
  }
}
