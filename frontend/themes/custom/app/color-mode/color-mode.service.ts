import { DOCUMENT } from '@angular/common';
import { afterNextRender, computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

type ColorMode = 'light' | 'dark';

/** Browser preference only: a fresh visitor always starts in light mode. */
@Injectable({ providedIn: 'root' })
export class ColorModeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mode = signal<ColorMode>('light');
  private readonly storageKey = 'ufal.color-mode';
  private transitionTimer?: number;

  readonly isDark = computed(() => this.mode() === 'dark');

  constructor() {
    // SSR renders the default. Browser state is restored after hydration; the
    // small index.html initializer has already applied the saved palette.
    afterNextRender(() => {
      this.apply(this.readPreference(), false);
      const browserWindow = this.document.defaultView;
      browserWindow?.addEventListener('storage', this.onStorage);
      this.destroyRef.onDestroy(() => {
        browserWindow?.removeEventListener('storage', this.onStorage);
        browserWindow?.clearTimeout(this.transitionTimer);
        this.document.documentElement.classList.remove('ufal-theme-changing');
      });
    });
  }

  toggle(): void {
    const mode = this.isDark() ? 'light' : 'dark';
    this.apply(mode, true);
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, mode);
    } catch {
      // The switch still works for this visit if persistence is blocked.
    }
  }

  private readPreference(): ColorMode {
    try {
      return this.document.defaultView?.localStorage.getItem(this.storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === this.storageKey || event.key === null) {
      this.apply(this.readPreference(), true);
    }
  };

  private apply(mode: ColorMode, animate: boolean): void {
    const root = this.document.documentElement;
    const window = this.document.defaultView;
    if (animate && window && mode !== this.mode()) {
      window.clearTimeout(this.transitionTimer);
      root.classList.add('ufal-theme-changing');
      this.transitionTimer = window.setTimeout(() => root.classList.remove('ufal-theme-changing'), 300);
    }
    root.setAttribute('data-bs-theme', mode);
    this.mode.set(mode);
  }
}
