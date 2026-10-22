import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HoroscopeService } from './horoscope.service';
import { HOROSCOPE_SOURCE, Horoscope, HoroscopeRecords, HoroscopeSource } from './horoscope.source';

describe('HoroscopeService', () => {
  let service: HoroscopeService;
  let source: jasmine.SpyObj<HoroscopeSource>;
  let publish: (records: HoroscopeRecords | null) => void;
  let latest: Horoscope | null;
  const initial = { id: 'horoscope', text: 'Horoscopul zilei', published: false };

  beforeEach(() => {
    source = jasmine.createSpyObj('HoroscopeSource', ['listen', 'save']);
    source.listen.and.callFake(next => {
      publish = next;
      next({ horoscope: initial });
      return () => {};
    });
    source.save.and.returnValue(Promise.resolve());
    TestBed.configureTestingModule({ providers: [{ provide: HOROSCOPE_SOURCE, useValue: source }] });
    service = TestBed.inject(HoroscopeService);
    service.init();
    service.getHoroscopeUpdateListener().subscribe(value => latest = value);
  });

  it('replays the current state to a subscriber created after the Firebase snapshot', () => {
    expect(latest).toEqual(initial);
    service.init();
    expect(source.listen).toHaveBeenCalledTimes(1);
  });

  it('delivers Firebase updates inside Angular even when the callback runs outside it', () => {
    let insideAngular = false;
    service.getHoroscopeUpdateListener().subscribe(() => insideAngular = NgZone.isInAngularZone());
    TestBed.inject(NgZone).runOutsideAngular(() => publish({ horoscope: { ...initial, published: true } }));
    expect(insideAngular).toBeTrue();
    expect(latest?.published).toBeTrue();
  });

  it('updates every subscriber immediately before the write completes', async () => {
    let finish!: () => void;
    source.save.and.returnValue(new Promise<void>(resolve => finish = resolve));
    const saving = service.onUpdate({ ...initial, published: true });
    expect(latest?.published).toBeTrue();
    finish();
    await saving;
  });

  it('restores the previous state on a failed write', async () => {
    source.save.and.returnValue(Promise.reject(new Error('Write failed')));
    await expectAsync(service.onUpdate({ ...initial, published: true })).toBeRejected();
    expect(latest).toEqual(initial);
  });

  it('does not roll back a newer edit when an older write fails', async () => {
    let fail!: (error: Error) => void;
    source.save.and.returnValues(new Promise<void>((_resolve, reject) => fail = reject), Promise.resolve());
    const first = service.onUpdate({ ...initial, published: true });
    const failed = expectAsync(first).toBeRejected();
    await service.onUpdate({ ...initial, text: 'Text actualizat', published: true });
    fail(new Error('Old write failed'));
    await failed;
    expect(latest?.text).toBe('Text actualizat');
    expect(latest?.published).toBeTrue();
  });
});
