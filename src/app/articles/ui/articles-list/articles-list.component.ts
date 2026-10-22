import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Article } from '../../data-access/articles.service';
import { EditDialogComponent } from '../../feature/edit-dialog/edit-dialog.component';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent {

  constructor(private dialog: Dialog) {}

  @Input() articles: Article[] = []
  @Output() articleDropped = new EventEmitter<CdkDragDrop<Article[], Article[], Article>>()

  openEditor(article : any) {
    this.dialog.open(EditDialogComponent, { data : article })
  }
}
