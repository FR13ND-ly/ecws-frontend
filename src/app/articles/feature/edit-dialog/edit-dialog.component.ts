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

  constructor(private dialogRef: DialogRef, @Inject(DIALOG_DATA) public data: any, private articlesService : ArticlesService, private dialog: MatDialog) {}

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
}
