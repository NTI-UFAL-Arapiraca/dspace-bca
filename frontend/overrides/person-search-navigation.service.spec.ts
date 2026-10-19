import { ViewportScroller } from '@angular/common';
import { DOCUMENT, Injector } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, Scroll } from '@angular/router';
import { Subject } from 'rxjs';

import { PersonSearchNavigationService } from './person-search-navigation.service';

describe('Person search scrolling', () => {
  const profile = '/entities/person/person-uuid';
  let events: Subject<any>;
  let router: any;
  let viewport: any;
  let results: any;
  let document: any;
  let service: PersonSearchNavigationService;

  beforeEach(() => {
    events = new Subject();
    router = { url: profile, events };
    viewport = jasmine.createSpyObj('viewport', ['setHistoryScrollRestoration', 'scrollToPosition', 'scrollToAnchor']);
    results = jasmine.createSpyObj('results', ['scrollIntoView', 'focus']);
    document = {
      getElementById: jasmine.createSpy().and.returnValue(results),
      defaultView: { matchMedia: jasmine.createSpy().and.returnValue({ matches: false }) },
    };
    service = Injector.create({ providers: [
      PersonSearchNavigationService,
      { provide: Router, useValue: router },
      { provide: ViewportScroller, useValue: viewport },
      { provide: DOCUMENT, useValue: document },
    ] }).get(PersonSearchNavigationService);
  });

  it('handles the initial shared-link anchor even if NavigationStart preceded the app component', () => {
    events.next(new Scroll(new NavigationEnd(1, profile, profile), null, 'person-works'));
    expect(viewport.scrollToAnchor).toHaveBeenCalledWith('person-works');
  });

  it('smoothly scrolls local filters, focuses the destination and respects reduced motion', () => {
    const next = profile + '?f.course=A,equals#person-works';
    events.next(new NavigationStart(2, next));
    expect(service.isLocalSearch(2)).toBeTrue();
    events.next(new Scroll(new NavigationEnd(2, next, next), null, 'person-works'));
    expect(results.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(results.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(viewport.scrollToPosition).not.toHaveBeenCalled();

    document.defaultView.matchMedia.and.returnValue({ matches: true });
    events.next(new Scroll(new NavigationEnd(2, next, next), null, 'person-works'));
    expect(results.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
  });

  it('restores the previous scroll position when going back within a profile', () => {
    const next = profile + '?tab=RELATION.Person.authored';
    events.next(new NavigationStart(2, next, 'popstate', { navigationId: 1 }));
    events.next(new Scroll(new NavigationEnd(2, next, next), [0, 240], null));
    expect(viewport.scrollToPosition).toHaveBeenCalledWith([0, 240], { behavior: 'instant' });
    expect(results.scrollIntoView).not.toHaveBeenCalled();
  });

  it('keeps the upstream top/anchor behavior when leaving the profile', () => {
    const next = '/items/work-uuid';
    events.next(new NavigationStart(2, next));
    expect(service.isLocalSearch(2)).toBeFalse();
    events.next(new Scroll(new NavigationEnd(2, next, next), null, null));
    expect(viewport.scrollToPosition).toHaveBeenCalledWith([0, 0]);
    events.next(new Scroll(new NavigationEnd(2, next, next), null, 'other-section'));
    expect(viewport.scrollToAnchor).toHaveBeenCalledWith('other-section');
    expect(results.scrollIntoView).not.toHaveBeenCalled();
  });
});
