import { Component, Input } from '@angular/core';
import { WidgetsService } from '../../data-access/widgets.service';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent {
  
  constructor(private widgetsService : WidgetsService) { }
  @Input() widget! : any
  editable : boolean = false

  onCopy() {
    navigator.clipboard.writeText(this.widget.text)
    this.widget.resolved = true
    this.widgetsService.onUpdate(this.widget)
  }

  onChange() {
    this.widget.resolved = false
    this.editable = false
    this.widgetsService.onUpdate(this.widget)
  }

  onDelete() {
    if (!confirm("Ești sigur?")) return
    this.widgetsService.delete(this.widget.id)
  }
}
