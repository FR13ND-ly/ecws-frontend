import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup} from '@angular/forms';
import { debounceTime, filter } from 'rxjs';
import { Article, ArticleRevision, ArticlesService } from '../../data-access/articles.service';
import { FileDialogComponent } from '../file-dialog/file-dialog.component';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent implements OnInit {

  constructor(private dialogRef: DialogRef, @Inject(DIALOG_DATA) public data: any, private articlesService : ArticlesService, private dialog: Dialog) {
    this.dialogRef.disableClose = data.disableClose;
  }
  
  pdfImageUrl = "https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png"
  historyOpen = false;
  historyLoading = false;
  restoring = false;
  revisions: ArticleRevision[] = [];
  selectedRevision?: ArticleRevision;

  articleForm = new FormGroup({
    title: new FormControl(this.data.title),
    text: new FormControl(this.data.text),
    details : new FormControl(this.data.details),
    page: new FormControl(this.data.page),
  });

  ngOnInit() {
    this.articleForm.valueChanges.pipe(
      filter(() => !this.data.new),
      debounceTime(500),
    )
    .subscribe(() => this.onSubmit())
  }

  onSubmit() {
    let article : any = {
      ...this.articleForm.value,
      ...{
        col : this.data.col,
        files : this.data.files
      }
    }
    article.title = article.title.trim()
    article.text = article.text.trim()
    if (this.articleForm.valid) {
      if (this.data.new) {
        this.articlesService.addNewArticle(article).subscribe({
          next: () => this.dialogRef.close(),
          error: (error) => console.error('Article creation failed', error)
        })
      }
      else {
        article.id = this.data.id
        article.position = this.data.position ?? 0
        this.articlesService.updateArticle(article).subscribe({
          error: (error) => console.error('Article update failed', error)
        })
      }
    }
  }

  onAddFile() {
    const fileManager = this.dialog.open<string>(FileDialogComponent)
    fileManager.closed.subscribe((res) => {
      if (!res) return
      this.data.files.push(res)
      if (!this.data.new) this.onSubmit()
    })
  }

  removeFile(i : any) {
    this.data.files.splice(i, 1)
    if (!this.data.new) this.onSubmit()
  }

  toggleHistory(): void {
    this.historyOpen = !this.historyOpen;
    if (!this.historyOpen || this.data.id == null) return;
    this.loadHistory();
  }

  selectRevision(revision: ArticleRevision): void {
    this.selectedRevision = revision;
  }

  restoreSelectedRevision(): void {
    if (!this.selectedRevision || this.data.id == null || this.restoring) return;
    this.restoring = true;
    this.articlesService.restoreRevision(this.data.id, this.selectedRevision.id).subscribe({
      next: (article) => {
        this.applyArticle(article);
        this.historyOpen = false;
        this.restoring = false;
      },
      error: (error) => {
        this.restoring = false;
        console.error('Article revision could not be restored', error);
      }
    });
  }

  revisionLabel(revision: ArticleRevision): string {
    const date = new Date(revision.updatedAt);
    return Number.isNaN(date.getTime())
      ? revision.updatedAt
      : date.toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  onResolve() {
    this.articlesService.changeToSecondCol(this.data.id).subscribe({
      next: () => this.dialogRef.close(),
      error: (error) => console.error('Article transition failed', error)
    })
  }

  onRemoveArticle() {
    if (!confirm("Ești sigur?")) return
    this.articlesService.archiveArticle(this.data.id).subscribe({
      next: () => this.dialogRef.close(),
      error: (error) => console.error('Article archive failed', error)
    })
  }

  onClose() {
    this.dialogRef.close()
  }    

  private loadHistory(): void {
    this.historyLoading = true;
    this.articlesService.getRevisions(this.data.id).subscribe({
      next: (revisions) => {
        this.revisions = revisions;
        this.selectedRevision = revisions[0];
        this.historyLoading = false;
      },
      error: (error) => {
        this.historyLoading = false;
        console.error('Article history could not be loaded', error);
      }
    });
  }

  private applyArticle(article: Article): void {
    Object.assign(this.data, article);
    this.articleForm.patchValue({
      title: article.title,
      text: article.text,
      details: article.details,
      page: article.page
    }, { emitEvent: false });
  }
}
