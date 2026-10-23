import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MathService } from '@dspace/core/shared/math.service';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ExpandableAbstractComponent } from './expandable-abstract.component';

describe('ExpandableAbstractComponent', () => {
  let fixture: ComponentFixture<ExpandableAbstractComponent>;
  let resize: () => void;
  let disconnect: jasmine.Spy;
  let originalObserver: typeof ResizeObserver;

  beforeEach(async () => {
    originalObserver = window.ResizeObserver;
    disconnect = jasmine.createSpy('disconnect');
    window.ResizeObserver = class {
      constructor(callback: () => void) { resize = callback; }
      observe = jasmine.createSpy('observe');
      unobserve = jasmine.createSpy('unobserve');
      disconnect = disconnect;
    } as unknown as typeof ResizeObserver;
    await TestBed.configureTestingModule({
      imports: [ExpandableAbstractComponent, TranslateModule.forRoot()],
      providers: [{ provide: MathService, useValue: { ready: () => of(true), render: () => Promise.resolve() } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ExpandableAbstractComponent);
    fixture.componentRef.setInput('abstract', { title: 'Abstract', language: 'en', value: 'Complete summary text.' });
    fixture.componentRef.setInput('contentId', 'abstract-work-1');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    window.ResizeObserver = originalObserver;
  });

  function measure(scrollHeight: number, clientHeight: number): void {
    const text = fixture.nativeElement.querySelector('.abstract-text');
    Object.defineProperties(text, {
      scrollHeight: { configurable: true, value: scrollHeight },
      clientHeight: { configurable: true, value: clientHeight },
    });
    resize();
    fixture.detectChanges();
  }

  it('changes the visual preview without hiding the full abstract from assistive technology', () => {
    measure(800, 288);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const text: HTMLElement = fixture.nativeElement.querySelector('.abstract-text');
    expect(button.getAttribute('aria-controls')).toBe(text.id);
    expect(button.hasAttribute('aria-expanded')).toBeFalse();
    expect(text.lang).toBe('en');
    expect(text.textContent?.trim()).toBe('Complete summary text.');
    expect(text.hidden).toBeFalse();
    expect(text.hasAttribute('aria-hidden')).toBeFalse();
    button.click();
    fixture.detectChanges();
    expect(text.classList).toContain('is-expanded');
    expect(text.textContent?.trim()).toBe('Complete summary text.');
    button.click();
    fixture.detectChanges();
    expect(text.classList).not.toContain('is-expanded');
    expect(text.textContent?.trim()).toBe('Complete summary text.');
    expect(text.hidden).toBeFalse();
    expect(text.hasAttribute('aria-hidden')).toBeFalse();
  });

  it('does not show a control for short text and updates when the column width changes', () => {
    measure(100, 100);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    measure(450, 288);
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
    measure(200, 200);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('disconnects the observer on destruction', () => {
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('uses a ten-line preview at both narrow and wide widths', () => {
    const text: HTMLElement = fixture.nativeElement.querySelector('.abstract-text');
    for (const width of ['320px', '900px']) {
      text.style.width = width;
      const style = getComputedStyle(text);
      expect(parseFloat(style.maxBlockSize) / parseFloat(style.lineHeight)).toBeCloseTo(10, 1);
    }
  });
});
