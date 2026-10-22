import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Article, ArticlesService } from './articles.service';
import { environment } from '../../../environments/environment';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let http: HttpTestingController;
  const apiUrl = environment.apiURL + 'articles/';
  const articles: Article[] = [1, 2, 3].map((id, position) => ({
    id, col: 1, position, title: `Articol ${id}`, text: '', details: '', page: 1, files: []
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ArticlesService);
    http = TestBed.inject(HttpTestingController);
    service.reload();
    flushReload(articles);
  });

  afterEach(() => http.verify());

  function flushReload(items: Article[]) {
    http.expectOne(request => request.url === apiUrl && !request.params.has('archived')).flush(items);
    http.expectOne(request => request.url === apiUrl && request.params.has('archived')).flush([]);
  }

  it('publishes the new order and metadata immediately, then confirms it without a realtime event', fakeAsync(() => {
    let latest: Article[][] = [];
    service.getArticlesUpdateListener().subscribe(lists => latest = lists);
    service.moveArticle(3, 1, 1).subscribe();

    expect(latest[0].map(item => item.id)).toEqual([3, 1, 2]);
    expect(latest[0].map(item => item.position)).toEqual([0, 1, 2]);
    const request = http.expectOne(apiUrl + 'reorder/');
    expect(request.request.body).toEqual({ col: 1, order: [3, 1, 2] });
    request.flush({ status: 'success' });
    flushReload(latest.flat());
    expect(service.articles[0].map(item => item.id)).toEqual([3, 1, 2]);
    tick(1500);
  }));

  it('keeps the full order when the destination anchor follows hidden cards', fakeAsync(() => {
    service.moveArticle(1, 1, 3).subscribe();
    expect(service.articles[0].map(item => item.id)).toEqual([2, 1, 3]);
    const request = http.expectOne(apiUrl + 'reorder/');
    expect(request.request.body).toEqual({ col: 1, order: [2, 1, 3] });
    const saved = service.articles.flat();
    request.flush({ status: 'success' });
    flushReload(saved);
    tick(1500);
  }));

  it('restores the previous board and reports a failed save to the caller', fakeAsync(() => {
    const onError = jasmine.createSpy('onError');
    service.moveArticle(1, 2).subscribe({ error: onError });
    expect(service.articles[1][0]).toEqual(jasmine.objectContaining({ id: 1, col: 2, position: 0 }));
    http.expectOne(apiUrl + 'reorder/').flush('Failed', { status: 500, statusText: 'Server error' });

    expect(onError).toHaveBeenCalled();
    expect(service.articles[0].map(item => item.id)).toEqual([1, 2, 3]);
    expect(service.articles[1]).toEqual([]);
    flushReload(articles);
    tick(1500);
  }));
});
