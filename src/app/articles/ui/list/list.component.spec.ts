import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Article, ArticlesService } from '../../data-access/articles.service';
import { MaterialModule } from '../../../material.module';
import { ArticlesListComponent } from '../articles-list/articles-list.component';
import { ListComponent } from './list.component';
import { environment } from '../../../../environments/environment';

function article(id: number, col: number, position: number): Article {
  return { id, col, position, title: `Articol ${id}`, text: '', details: '', page: 1, files: [] };
}

@Component({
  template: `
    <div *ngIf="lists$ | async as lists" cdkDropListGroup style="display: flex; gap: 16px">
      <app-list style="width: 280px" name="Disponibile" [col]="1" [articles]="visible(lists[0])"></app-list>
      <app-list style="width: 280px" name="Aranjate" [col]="2" [articles]="visible(lists[1])"></app-list>
    </div>
  `
})
class BoardComponent {
  lists$ = this.service.getArticlesUpdateListener();
  hiddenIds: number[] = [];
  constructor(private service: ArticlesService) {}
  visible(list: Article[]) {
    return this.hiddenIds.length ? list.filter(item => !this.hiddenIds.includes(item.id!)) : list;
  }
}

describe('Article board drag and drop', () => {
  let fixture: ComponentFixture<BoardComponent>;
  let service: ArticlesService;
  let http: HttpTestingController;
  const apiUrl = environment.apiURL + 'articles/';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, MaterialModule, NoopAnimationsModule, HttpClientTestingModule],
      declarations: [BoardComponent, ListComponent, ArticlesListComponent],
      providers: [
        { provide: Dialog, useValue: jasmine.createSpyObj('Dialog', ['open']) }
      ]
    }).compileComponents();
    service = TestBed.inject(ArticlesService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BoardComponent);
    load([article(1, 1, 0), article(2, 1, 1), article(3, 2, 0)]);
  });

  afterEach(() => http.verify());

  function load(articles: Article[]) {
    service.reload();
    flushReload(articles);
  }

  function flushReload(articles: Article[]) {
    http.expectOne(request => request.url === apiUrl && !request.params.has('archived')).flush(articles);
    http.expectOne(request => request.url === apiUrl && request.params.has('archived')).flush([]);
    fixture.detectChanges();
  }

  function confirmSave(col: number, order: number[]) {
    const request = http.expectOne(apiUrl + 'reorder/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ col, order });
    const saved = service.articles.flat();
    request.flush({ status: 'success' });
    flushReload(saved);
    tick(1500);
  }

  function dragTo(source: HTMLElement, x: number, y: number): void {
    const rect = source.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    function mouse(target: EventTarget, type: string, clientX: number, clientY: number) {
      target.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, button: 0, buttons: type === 'mouseup' ? 0 : 1,
        clientX, clientY, view: window
      }));
    }
    mouse(source, 'mousedown', startX, startY);
    mouse(document, 'mousemove', startX + 10, startY + 10);
    tick(50);
    mouse(document, 'mousemove', x, y);
    tick(300);
    mouse(document, 'mouseup', x, y);
    tick(500);
    fixture.detectChanges();
  }

  it('reorders cards in the same column and saves their order', fakeAsync(() => {
    const cards = fixture.nativeElement.querySelectorAll('.article') as NodeListOf<HTMLElement>;
    const target = cards[1].getBoundingClientRect();
    dragTo(cards[0], target.left + target.width / 2, target.bottom - 5);

    expect(service.articles[0].map(item => item.id)).toEqual([2, 1]);
    expect(service.articles[0].map(item => item.position)).toEqual([0, 1]);
    confirmSave(1, [2, 1]);
    expect(fixture.nativeElement.querySelector('.article__title').textContent).toContain('Articol 2');
  }));

  it('moves a card to another column', fakeAsync(() => {
    const lists = fixture.nativeElement.querySelectorAll('.cdk-drop-list') as NodeListOf<HTMLElement>;
    const target = lists[1].getBoundingClientRect();
    dragTo(lists[0].querySelector('.article')!, target.left + target.width / 2, target.top + 10);

    expect(service.articles[0].map(item => item.id)).toEqual([2]);
    expect(service.articles[1].map(item => item.id)).toEqual([1, 3]);
    expect(service.articles[1][0].col).toBe(2);
    expect(service.articles[0][0].position).toBe(0);
    confirmSave(2, [1, 3]);
  }));

  it('accepts a card in an empty column', fakeAsync(() => {
    load([article(1, 1, 0), article(2, 1, 1)]);
    const lists = fixture.nativeElement.querySelectorAll('.cdk-drop-list') as NodeListOf<HTMLElement>;
    const target = lists[1].getBoundingClientRect();
    dragTo(lists[0].querySelector('.article')!, target.left + target.width / 2, target.top + 30);

    expect(service.articles[1].map(item => item.id)).toEqual([1]);
    confirmSave(2, [1]);
  }));

  it('preserves hidden cards when moving with a search filter active', fakeAsync(() => {
    load([article(1, 1, 0), article(2, 1, 1), article(3, 2, 0), article(4, 2, 1)]);
    fixture.componentInstance.hiddenIds = [2, 4];
    fixture.detectChanges();
    const lists = fixture.nativeElement.querySelectorAll('.cdk-drop-list') as NodeListOf<HTMLElement>;
    const target = lists[1].getBoundingClientRect();
    dragTo(lists[0].querySelector('.article')!, target.left + target.width / 2, target.top + 10);

    expect(service.articles[0].map(item => item.id)).toEqual([2]);
    expect(service.articles[1].map(item => item.id)).toEqual([1, 3, 4]);
    confirmSave(2, [1, 3, 4]);
  }));

  it('leaves the board unchanged when dropped outside the columns', fakeAsync(() => {
    const source = fixture.nativeElement.querySelector('.article');
    dragTo(source, 750, 550);
    expect(service.articles[0].map(item => item.id)).toEqual([1, 2]);
    http.expectNone(apiUrl + 'reorder/');
  }));

  it('still reorders after an edit publishes copies of the column arrays', fakeAsync(() => {
    const edited = { ...service.articles[0][1], title: 'Articol editat' };
    service.updateArticle(edited).subscribe();
    http.expectOne(apiUrl + '2/').flush(edited);
    tick(1500);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.article') as NodeListOf<HTMLElement>;
    const target = cards[1].getBoundingClientRect();
    dragTo(cards[0], target.left + target.width / 2, target.bottom - 5);

    expect(service.articles[0].map(item => item.id)).toEqual([2, 1]);
    confirmSave(1, [2, 1]);
    expect(fixture.nativeElement.querySelector('.article__title').textContent).toContain('Articol editat');
  }));
});
