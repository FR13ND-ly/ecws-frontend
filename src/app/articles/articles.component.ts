import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, combineLatest } from 'rxjs';
import { ArticlesService } from './data-access/articles.service';
import { MatDialog } from '@angular/material/dialog';
import { SearchDialogComponent } from './feature/search-dialog/search-dialog.component';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss']
})
export class ArticlesComponent implements OnInit {

  constructor(private articlesService: ArticlesService, private store : Store<any>, private dialog: MatDialog) { }

  articlesRaw$ = this.articlesService.getArticlesUpdateListener()

  searchText$ = this.store.select('searchText')

  articles$ : Observable<any> = combineLatest(this.articlesRaw$, this.searchText$).pipe(
    map((res) => this.resolveFilter(res[0], res[1]))
  )

  isDragging : boolean = false
  ngOnInit(): void {
    this.articlesService.init()
  }

  openSearch() {
    this.dialog.open(SearchDialogComponent, {
      width: 'min(92vw, 560px)',
      autoFocus: 'input'
    })
  }

  nextEdition() {
    if (!confirm('Începi o ediție nouă? Articolele publicate vor fi mutate în arhivă.')) return
    this.articlesService.changeEdition().subscribe({
      error: (error) => console.error('Edition could not be changed', error)
    })
  }

  resolveFilter(lists : any, searchText : string) {
    if (!searchText?.trim()) return lists
    return lists.map((list : any) => list.filter((el : any) => {
      const pageMatch = searchText.match(/^#\s*(\d+)$/)
      if (pageMatch) return el.page === Number(pageMatch[1])
      const search = this.normalize(searchText)
      return this.normalize(`${el.text ?? ''} ${el.title ?? ''} ${el.details ?? ''}`).includes(search)
    }))
  }

  private normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }
}
