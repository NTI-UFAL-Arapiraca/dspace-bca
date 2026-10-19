import { ViewportScroller } from '@angular/common';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { NavigationStart, Router, Scroll } from '@angular/router';

import { isPersonSearchNavigation } from './person-search-navigation-policy';

/** Coordinates the route loader and scrolling without hiding a Person during search. */
@Injectable({ providedIn: 'root' })
export class PersonSearchNavigationService {
  private router = inject(Router);
  private viewport = inject(ViewportScroller);
  private document = inject(DOCUMENT);
  private navigationId: number;
  private localSearch = false;

  constructor() {
    // This service handles Scroll events, including the existing behavior on other pages.
    this.viewport.setHistoryScrollRestoration('manual');
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navigationId = event.id;
        this.localSearch = isPersonSearchNavigation(this.router.url, event.url);
      } else if (event instanceof Scroll &&
          (this.navigationId === undefined || event.routerEvent.id === this.navigationId)) {
        this.scroll(event);
      }
    });
  }

  isLocalSearch(navigationId: number): boolean {
    return navigationId === this.navigationId && this.localSearch;
  }

  scrollToWorks(behavior: ScrollBehavior = 'smooth', focus = false): void {
    const results = this.document.getElementById('person-works');
    if (results) {
      const reducedMotion = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      results.scrollIntoView({ behavior: reducedMotion ? 'instant' : behavior, block: 'start' });
      if (focus) results.focus({ preventScroll: true });
    }
  }

  private scroll(event: Scroll): void {
    if (this.localSearch) {
      if (event.position) {
        this.viewport.scrollToPosition(event.position, { behavior: 'instant' });
        return;
      }
      this.scrollToWorks('smooth', event.anchor === 'person-works');
      return;
    }

    // Preserve the upstream top/anchor behavior for navigation outside Person search.
    if (event.position) {
      this.viewport.scrollToPosition([0, 0], { behavior: 'instant' });
    } else if (event.anchor) {
      this.viewport.scrollToAnchor(event.anchor);
    } else {
      this.viewport.scrollToPosition([0, 0]);
    }
  }
}
