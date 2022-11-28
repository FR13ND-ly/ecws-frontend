import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { ArticlesService } from '../../data-access/articles.service';
import { EditDialogComponent } from '../../feature/edit-dialog/edit-dialog.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {

  constructor(private articlesService : ArticlesService, private dialog: Dialog) {}

  @Input() name! : any
  @Input() articles! : any
  @Input() col! : any

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    let order : string[] = []
    event.container.data.forEach((el : any) => order.push(el['id']))
    let val = {
      order,
      col : parseInt(event.container.id.slice(-1)) + 1
    }
    this.articlesService.changeCol(val)
  }

  onAddArticle() {
    this.dialog.open(EditDialogComponent, { data : {
      title: '',
      text: '',
      page: 1,
      details: '',
      files: [],
      col : this.col,
      new: true
    }})
  }
}
