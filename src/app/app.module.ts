import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PagesComponent } from './pages/pages.component';
import { ArticlesComponent } from './articles/articles.component';
import { FilesComponent } from './files/files.component';
import { WidgetsComponent } from './widgets/widgets.component';
import { MaterialModule } from './material.module';
import { ArticlesListComponent } from './articles/ui/articles-list/articles-list.component';
import { ListComponent } from './articles/ui/list/list.component';
import { EditDialogComponent } from './articles/feature/edit-dialog/edit-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileDialogComponent } from './articles/feature/file-dialog/file-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { appState } from './state/app.state';
import { StoreModule } from '@ngrx/store';
import { SearchDialogComponent } from './articles/feature/search-dialog/search-dialog.component';
import { WidgetComponent } from './widgets/ui/widget/widget.component';
import { HoroscopeComponent } from './horoscope/horoscope.component';

@NgModule({
  declarations: [
    AppComponent,
    PagesComponent,
    ArticlesComponent,
    FilesComponent,
    WidgetsComponent,
    ArticlesListComponent,
    ListComponent,
    EditDialogComponent,
    FileDialogComponent,
    SearchDialogComponent,
    WidgetComponent,
    HoroscopeComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forRoot(appState)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
