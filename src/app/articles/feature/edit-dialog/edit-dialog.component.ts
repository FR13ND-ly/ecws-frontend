import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, tap } from 'rxjs';
import { ArticlesService } from '../../data-access/articles.service';
import { FileDialogComponent } from '../file-dialog/file-dialog.component';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent implements OnInit {

  constructor(private dialogRef: DialogRef, @Inject(DIALOG_DATA) public data: any, private articlesService : ArticlesService, private dialog: MatDialog) {
    this.dialogRef.disableClose = data.disableClose;
  }
  
  pdfImageUrl = "https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png"

  articleForm = new FormGroup({
    title: new FormControl(this.data.title),
    text: new FormControl(this.data.text),
    details : new FormControl(this.data.details),
    page: new FormControl(this.data.page),
  });

  ngOnInit() {
    this.articleForm.valueChanges.pipe(
      filter(() => !this.data.new),
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
        this.articlesService.addNewArticle(article)
        this.dialogRef.close()
      }
      else {
        article.id = this.data.id
        this.articlesService.updateArticle(article)
      }
    }
  }

  onAddFile() {
    let fileManager = this.dialog.open(FileDialogComponent)
    fileManager.afterClosed().subscribe((res) => {
      if (!res) return
      this.data.files.push(res)
      this.onSubmit()
    })
  }

  removeFile(i : any) {
    this.data.files.splice(i, 1)
    this.onSubmit()
  }

  onResolve() {
    this.articlesService.changeToSecondCol(this.data.id)
    this.dialogRef.close()
  }

  onRemoveArticle() {
    if (!confirm("Ești sigur?")) return
    this.articlesService.removeArticle(this.data.id)
    this.dialogRef.close()
  }

  onClose() {
    this.dialogRef.close()
  }    
}
