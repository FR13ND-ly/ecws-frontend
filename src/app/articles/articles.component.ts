import { Dialog } from '@angular/cdk/dialog';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, combineLatest } from 'rxjs';
import { ArticlesService } from './data-access/articles.service';
import { SearchDialogComponent } from './feature/search-dialog/search-dialog.component';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss']
})
export class ArticlesComponent implements OnInit {

  constructor(private articlesService: ArticlesService, private store : Store<any>, private dialog : Dialog) { }

  articlesRaw$ = this.articlesService.getArticlesUpdateListener()

  searchText$ = this.store.select('searchText')

  articles$ : Observable<any> = combineLatest(this.articlesRaw$, this.searchText$).pipe(
    map((res) => this.resolveFilter(res[0], res[1]))
  )

  isDragging : boolean = false
  ngOnInit(): void {
    this.articlesService.init()
  }

  nextEdition() {
    this.articlesService.changeEdition()
  }

  resolveFilter(lists : any, searchText : string) {
    if (!searchText?.trim()) return lists
    return lists.map((list : any) => list.filter((el : any) => {
      if (searchText[0] == "#") return el.page == searchText[1]
      return el.text.includes(searchText)  ||
             el.title.includes(searchText) ||
             el.details.includes(searchText)
    }))
  }

  onOpenSearchDialog() {
    this.dialog.open(SearchDialogComponent)
  }
}
