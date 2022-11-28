import { Injectable } from '@angular/core';
import { getDatabase, ref, update, push, onValue, get, remove } from "firebase/database";
import { bindCallback, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  constructor() { }

  private articlesUpdated = new Subject<[][]>()

  private db = getDatabase();

  articles: any = []

  init() {
    onValue(ref(this.db, 'articles'), (snapshot) => {
      this.articlesUpdated.next([...this.resolveArticles(snapshot.val())])
    })
  }

  resolveArticles(articlesRaw1 : any) : any {
    let articles : any = [[], [], [], []]
    let articlesRaw: any = []
    if (articlesRaw1) {
      Object.entries(articlesRaw1).map((article : any) => {
        article[1].id = article[0]
        article[1].files = article[1].files ?? []
        articlesRaw.push(article[1])
      })
    }
    articlesRaw.sort((a : any, b : any) => {
      if (a.position < b.position) return -1
      if (a.position > b.position) return 1
      return 0
    })
    
    articlesRaw.forEach((article : any)=> {
      articles[article.col - 1].push(article)
    }) 
    this.articles = articles
    return articles
  }

  getArticlesUpdateListener() {
    return this.articlesUpdated.asObservable()
  }

  changeCol(data : any) {
    data.order.forEach(async (article : any, index : number) => {
      await update(ref(this.db, `articles/${article}`), {
        col : data.col,
        position : index
      })
    });
  }

  addNewArticle(article : any) {
    let date = new Date()
    article.date = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    article.position = this.articles[article.col - 1].length
    push(ref(this.db, 'articles'), article)
  }

  removeArticle(id : any) {
    remove(ref(this.db, `articles/${id}`))
  }

  async updateArticle(article : any) {
    await update(ref(this.db, `articles/${article.id}`), article)
  }

  async changeToSecondCol(id : any) {
    await update(ref(this.db, `articles/${id}`), {
      col : 2,
      position : this.articles[1].length
    })
  }

  changeEdition() {
    this.articles[2].forEach((el : any) => {
      this.removeArticle(el.id)
    })
    this.articles[1].forEach(async (el : any) => {
      await update(ref(this.db, `articles/${el.id}`), {col : 3})
    })
  }
}
