import { Dialog } from '@angular/cdk/dialog';
import { Component, Input } from '@angular/core';
import { EditDialogComponent } from '../../feature/edit-dialog/edit-dialog.component';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent {

  constructor(private dialog: Dialog) {}

  @Input() articles! : any

  openEditor(article : any) {
    this.dialog.open(EditDialogComponent, { data : article })
  }
}
