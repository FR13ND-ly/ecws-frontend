import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { FilesService } from './files/data-access/files.service';
import { HoroscopeComponent } from './horoscope/horoscope.component';
import { HoroscopeService } from './horoscope/horoscope.service';
import { MaterialModule } from './material.module';
import { PagesService } from './pages/data-access/pages.service';

describe('Horoscope tab indicator', () => {
  let fixture: ComponentFixture<AppComponent>;
  let horoscope: BehaviorSubject<any>;
  let update: jasmine.Spy;

  beforeEach(async () => {
    horoscope = new BehaviorSubject({ id: 'horoscope', text: 'Horoscopul zilei', published: false });
    update = jasmine.createSpy('onUpdate').and.callFake(value => {
      horoscope.next({ ...value });
      return Promise.resolve();
    });
    await TestBed.configureTestingModule({
      imports: [MaterialModule, NoopAnimationsModule],
      declarations: [AppComponent, HoroscopeComponent],
      providers: [
        { provide: Store, useValue: { select: () => of(false) } },
        { provide: FilesService, useValue: { init: () => {} } },
        { provide: PagesService, useValue: {} },
        { provide: HoroscopeService, useValue: {
          init: () => {},
          getHoroscopeUpdateListener: () => horoscope.asObservable(),
          onUpdate: update
        } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    spyOn(fixture.componentInstance, 'changeMenu');
    fixture.detectChanges();
  });

  it('shows a check in the tab header only while the horoscope is published', () => {
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator')).toBeNull();
    horoscope.next({ ...horoscope.value, published: true });
    fixture.detectChanges();
    const indicator: HTMLElement = fixture.nativeElement.querySelector('.horoscope-tab__indicator');
    expect(indicator.textContent?.trim()).toBe('check_circle');
    expect(indicator.closest('[role="tab"]')?.textContent).toContain('Horoscop');
    expect(indicator.getAttribute('aria-label')).toBe('Horoscop publicat');

    horoscope.next({ ...horoscope.value, published: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator')).toBeNull();
  });

  it('updates the header when the publication button is toggled', async () => {
    fixture.componentInstance.selectedIndex = 5;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('app-horoscope button[aria-pressed]');
    button.click();
    fixture.detectChanges();
    expect(update).toHaveBeenCalledWith(jasmine.objectContaining({ published: true }));
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator')).not.toBeNull();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator')).toBeNull();
  });
});
