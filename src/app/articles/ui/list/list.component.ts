import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Article, ArticlesService } from '../../data-access/articles.service';
import { EditDialogComponent } from '../../feature/edit-dialog/edit-dialog.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {

  constructor(private articlesService: ArticlesService, private dialog: Dialog, private snackBar: MatSnackBar) {}

  @Input() name! : any
  @Input() articles! : any
  @Input() col!: number;

  drop(event: CdkDragDrop<Article[], Article[], Article>) {
    if (!event.isPointerOverContainer ||
        (event.previousContainer === event.container && event.previousIndex === event.currentIndex)) return

    const article = event.item.data
    if (article.id == null) return
    const siblings = event.container.data.filter(item => item.id !== article.id)
    const beforeId = siblings[event.currentIndex]?.id
    this.articlesService.moveArticle(article.id, Number(this.col), beforeId).subscribe({
      error: () => this.snackBar.open('Mutarea nu a putut fi salvată. Încearcă din nou.', 'Închide', { duration: 5000 })
    })
  }

  onAddArticle() {
    this.dialog.open(EditDialogComponent, { data : {
      title: '',
      text: '',
      page: 1,
      details: '',
      files: [],
      col: Number(this.col),
      new: true,
      disableClose : true
    }})
  }
}
