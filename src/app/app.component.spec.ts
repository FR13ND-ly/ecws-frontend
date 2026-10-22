import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone, NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { FilesService } from './files/data-access/files.service';
import { HoroscopeComponent } from './horoscope/horoscope.component';
import { HOROSCOPE_SOURCE, HoroscopeRecords } from './horoscope/horoscope.source';
import { MaterialModule } from './material.module';
import { PagesService } from './pages/data-access/pages.service';

describe('Horoscope tab indicator', () => {
  let fixture: ComponentFixture<AppComponent>;
  let publish: (records: HoroscopeRecords | null) => void;
  let update: jasmine.Spy;

  beforeEach(async () => {
    update = jasmine.createSpy('save').and.returnValue(Promise.resolve());
    await TestBed.configureTestingModule({
      imports: [MaterialModule, NoopAnimationsModule],
      declarations: [AppComponent, HoroscopeComponent],
      providers: [
        { provide: Store, useValue: { select: () => of(false) } },
        { provide: FilesService, useValue: { init: () => {} } },
        { provide: PagesService, useValue: {} },
        { provide: HOROSCOPE_SOURCE, useValue: {
          listen: (next: typeof publish) => {
            publish = next;
            next({ horoscope: { text: 'Horoscopul zilei', published: false } });
            return () => {};
          },
          save: update
        } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    spyOn(fixture.componentInstance, 'changeMenu');
    fixture.autoDetectChanges();
  });

  it('shows the real publication state in the tab header, including Firebase callbacks outside Angular', async () => {
    const initial: HTMLElement = fixture.nativeElement.querySelector('.horoscope-tab__indicator');
    expect(initial.getAttribute('aria-label')).toBe('Horoscop nepublicat');
    TestBed.inject(NgZone).runOutsideAngular(() => {
      publish({ horoscope: { text: 'Horoscopul zilei', published: true } });
    });
    await fixture.whenStable();
    const indicator: HTMLElement = fixture.nativeElement.querySelector('.horoscope-tab__indicator');
    expect(indicator.textContent?.trim()).toBe('✓');
    expect(indicator.closest('[role="tab"]')?.textContent).toContain('Horoscop');
    expect(indicator.getAttribute('aria-label')).toBe('Horoscop publicat');

    TestBed.inject(NgZone).runOutsideAngular(() => {
      publish({ horoscope: { text: 'Horoscopul zilei', published: false } });
    });
    await fixture.whenStable();
    expect(indicator.getAttribute('aria-label')).toBe('Horoscop nepublicat');
    expect(indicator.classList.contains('horoscope-tab__indicator--published')).toBeFalse();
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
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator').getAttribute('aria-label')).toBe('Horoscop publicat');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('.horoscope-tab__indicator').getAttribute('aria-label')).toBe('Horoscop nepublicat');
  });
});
