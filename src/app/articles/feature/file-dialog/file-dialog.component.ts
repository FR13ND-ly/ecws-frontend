import { DialogRef } from '@angular/cdk/dialog';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FilesService } from 'src/app/files/data-access/files.service';

@Component({
  selector: 'app-file-dialog',
  templateUrl: './file-dialog.component.html',
  styleUrls: ['./file-dialog.component.scss']
})
export class FileDialogComponent implements OnInit {

  constructor(private dialogRef: DialogRef, private filesService : FilesService) {}

  pdfImageUrl = "https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/02/07/35/020735e3-5214-a4a7-01b2-2bc55e89035b/AppIcon-0-1x_U007emarketing-0-7-0-85-220.png/1200x630wa.png"

  files$ : Observable<any> = this.filesService.getFilesUpdateListener()

  selected! : any

  ngOnInit(): void {
  }

  onUploadFile(event : any) {
    let file = event.target.files[0]
    let formData = new FormData()
    formData.append('file', file, file.name)
    this.filesService.uploadFile(formData)
    event.target.value = null
  }

  done(file : any) {
    this.dialogRef.close(file)
  }
}
