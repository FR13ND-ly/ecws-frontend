import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RssSource {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
}

export interface RssItem {
  id: number;
  sourceId: number;
  sourceName: string;
  title: string;
  url: string;
  summary: string;
  content: string;
  author: string;
  imageUrl: string;
  publishedAt: string | null;
  fetchedAt: string;
}

export interface RssRefreshResult {
  sources: number;
  items: number;
  errors: number;
}

@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly apiUrl = environment.apiURL + 'rss/';
  private readonly items = new BehaviorSubject<RssItem[]>([]);
  private readonly sources = new BehaviorSubject<RssSource[]>([]);
  private initialized = false;
  private events?: EventSource;

  constructor(private http: HttpClient) {}

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reload();
    this.events = new EventSource(environment.apiURL + 'events/');
    this.events.onmessage = (event) => {
      if (event.data === 'refresh' || event.data.startsWith('rss.')) this.reload();
    };
  }

  getItems(): Observable<RssItem[]> {
    return this.items.asObservable();
  }

  getSources(): Observable<RssSource[]> {
    return this.sources.asObservable();
  }

  refresh(): Observable<RssRefreshResult> {
    return this.http.post<RssRefreshResult>(this.apiUrl + 'refresh/', {}).pipe(
      tap(() => this.reload())
    );
  }

  addSource(payload: { name: string; url: string }): Observable<RssSource> {
    return this.http.post<RssSource>(this.apiUrl + 'sources/', payload).pipe(
      tap(() => this.reloadSources())
    );
  }

  deleteSource(id: number): Observable<unknown> {
    return this.http.delete(this.apiUrl + `sources/${id}/`).pipe(
      tap(() => this.reload())
    );
  }

  importUrl(url: string): Observable<RssItem> {
    return this.http.post<RssItem>(this.apiUrl + 'import-url/', { url });
  }

  reload(): void {
    this.reloadItems();
    this.reloadSources();
  }

  private reloadItems(): void {
    this.http.get<RssItem[]>(this.apiUrl + 'items/', { params: { limit: 500 } }).subscribe({
      next: (items) => this.items.next(items),
      error: (error) => console.error('RSS items could not be loaded', error)
    });
  }

  private reloadSources(): void {
    this.http.get<RssSource[]>(this.apiUrl + 'sources/').subscribe({
      next: (sources) => this.sources.next(sources),
      error: (error) => console.error('RSS sources could not be loaded', error)
    });
  }
}

export function plainRssText(value: string): string {
  if (!value) return '';
  const document = new DOMParser().parseFromString(value, 'text/html');
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function rssItemToArticleJson(item: RssItem): Record<string, unknown> {
  const text = plainRssText(item.content || item.summary);
  const summary = plainRssText(item.summary);
  return {
    source: {
      publisher: item.sourceName,
      url: item.url,
      publishedAt: item.publishedAt || null
    },
    slug: '',
    title: plainRssText(item.title),
    subtitle: '',
    lead: summary,
    secondaryCategories: [],
    tags: [],
    isFeatured: false,
    isBreaking: false,
    heroType: 'standard',
    body: text ? [{ type: 'text', content: `<p>${escapeHtml(text)}</p>` }] : [],
    metaTitle: '',
    metaDescription: summary,
    series: [],
    remoteImages: item.imageUrl ? [{
      url: item.imageUrl,
      placement: 'cover',
      altText: plainRssText(item.title),
      caption: `Sursa imaginii: ${item.sourceName}`
    }] : []
  };
}

export function rssItemToAiClipboard(item: RssItem): string {
  const json = JSON.stringify(rssItemToArticleJson(item), null, 2);
  return `${json}\n\n--- PROMPT PENTRU AI ---\n${ARTICLE_ADAPTATION_PROMPT}`;
}

const ARTICLE_ADAPTATION_PROMPT = `Adaptează materialul sursă într-un articol gata de importat în editorul Est-Curier.

REGULI DE RĂSPUNS
1. Returnează exclusiv un singur obiect JSON valid. Fără Markdown, comentarii, explicații sau text în afara obiectului.
2. Folosește numai câmpurile și valorile descrise mai jos. Nu adăuga status, authorId, coverImageId, id, publishedAt editorial sau alte câmpuri.
3. Nu inventa fapte, citate, persoane, cifre sau contexte. Reformulează jurnalistic în română și atribuie clar informația sursei originale.
4. Elimină meniuri, recomandări, reclame, apeluri promoționale și fragmente fără legătură cu articolul.
5. Păstrează source și remoteImages. Nu modifica URL-urile imaginilor și nu inventa identificatori media.

SCHEMA EXACTĂ A OBIECTULUI OUTPUT
{
  "source": {
    "publisher": "string",
    "url": "URL HTTP/HTTPS",
    "publishedAt": "string ISO-8601 sau null"
  },
  "slug": "string cu litere mici, cifre și cratime",
  "title": "string obligatoriu",
  "subtitle": "string; poate fi gol",
  "lead": "string obligatoriu, rezumat jurnalistic scurt",
  "primaryCategory": "un singur slug valid din lista de categorii",
  "secondaryCategories": ["zero sau mai multe slug-uri valide, fără categoria principală"],
  "tags": ["string lowercase", "fără duplicate"],
  "isFeatured": false,
  "isBreaking": false,
  "heroType": "standard | split | immersive | magazine",
  "body": ["blocuri definite mai jos"],
  "metaTitle": "string de maximum aproximativ 60 de caractere",
  "metaDescription": "string de maximum aproximativ 160 de caractere",
  "series": [{"series":"slug existent","position":1}],
  "remoteImages": ["obiecte definite mai jos"]
}

CATEGORII ACCEPTATE PENTRU primaryCategory ȘI secondaryCategories
refugiat-in-moldova, local, cultural, alegeri-parlamentare-2, economic, alegeri-prezidentiale, campanii, criuleni, divertisment, dubasari, ec-junior, ec-special, ecologic, est-curier, fii-cu-ochii-pe-autoritati, finante, incidente, international, interviu-2, accidente-rutiere, investigatii, justitie, longread, lucru-in-moldova-ec-special, lucru-in-moldova, no-coment, opinii-editorial, politie, publicitate-politica, sanatate, sportiv, educatie, politic, social, stop-fals, succes-comunitar, transport, uncategorized, interviu, alegeri-locale.

BLOCURI ACCEPTATE ÎN body
- Text: {"type":"text","content":"<p>Text HTML sigur, structurat în paragrafe.</p>"}
- HTML: {"type":"html","content":"HTML sigur"}
- Citat: {"type":"quote","content":"citat","author":"autor opțional"}
- Casetă informativă: {"type":"info","title":"titlu","content":"conținut"}
- Embed: {"type":"embed","url":"URL HTTP/HTTPS","provider":"string opțional"}
- Imagine existentă: {"type":"image","media_id":"UUID existent","title":"legendă opțională","layout":"content | wide | full"}
- Galerie existentă: {"type":"gallery","media_ids":["UUID existent"],"columns":2} sau {"type":"gallery","items":[{"media_id":"UUID existent","caption":"legendă opțională"}],"columns":2}
- PDF existent: {"type":"pdf","media_id":"UUID existent","title":"titlu opțional"}
- Sondaj existent: {"type":"poll","poll_id":1}
- Slider existent: {"type":"imageslider","slides":[{"media_id":"UUID existent","caption":"legendă opțională"}],"auto_play":false}
Pentru conținut preluat din RSS folosește în principal blocuri text. Nu crea blocuri image, gallery, pdf, poll sau imageslider cu ID-uri inventate; imaginile noi se declară în remoteImages.

STRUCTURA remoteImages
Fiecare element trebuie să aibă forma:
{
  "url": "URL HTTP/HTTPS păstrat exact",
  "placement": "cover | body",
  "altText": "descriere accesibilă opțională",
  "caption": "credit sau legendă opțională",
  "name": "nume de fișier opțional",
  "layout": "content | wide | full",
  "afterBlock": 0
}
Pentru placement cover omite afterBlock. Pentru placement body, afterBlock este indexul de la zero al blocului după care se inserează imaginea; dacă este omis, imaginea se adaugă la final. Păstrează cel puțin imaginea de copertă primită în JSON.

În series, series trebuie să fie slug-ul unei serii existente, iar position un număr întreg pozitiv. Păstrează valorile existente și nu inventa serii; dacă intrarea nu conține serii, returnează []. isFeatured și isBreaking trebuie să rămână întotdeauna false.`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n+/g, '</p><p>');
}
