import { DOCUMENT } from '@angular/common';
import { afterNextRender, inject, Injectable, NgZone } from '@angular/core';

import { initializeVLibras, VLibrasWindow } from './vlibras-widget';

@Injectable({ providedIn: 'root' })
export class VLibrasService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  constructor() {
    // afterNextRender never runs during SSR. Keep the external DOM and timers
    // outside Angular, after the initial render, for the lifetime of the page.
    afterNextRender(() => {
      const browserWindow = this.document.defaultView as VLibrasWindow | null;
      if (browserWindow) {
        this.zone.runOutsideAngular(() => initializeVLibras(this.document, browserWindow));
      }
    });
  }
}
