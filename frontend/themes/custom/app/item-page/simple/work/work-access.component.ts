import {
  AsyncPipe,
  isPlatformBrowser,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { DSONameService } from '@dspace/core/breadcrumbs/dso-name.service';
import { BitstreamDataService } from '@dspace/core/data/bitstream-data.service';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { Item } from '@dspace/core/shared/item.model';
import { getFirstCompletedRemoteData } from '@dspace/core/shared/operators';
import { TranslateModule } from '@ngx-translate/core';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';

import { ThemedFileDownloadLinkComponent } from '../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { ThemedAccessStatusBadgeComponent } from '../../../../../../app/shared/object-collection/shared/badges/access-status-badge/themed-access-status-badge.component';
import { FileSizePipe } from '../../../../../../app/shared/utils/file-size-pipe';
import {
  isPdfName,
  permanentLink,
  WorkAccessState,
} from './work-access-state';

/**
 * Access card of a work: one primary action (download), the access state in
 * words, and quiet actions to copy or share the permanent link. Download and
 * request-a-copy keep the official link component and its authorization.
 */
@Component({
  selector: 'ds-work-access',
  templateUrl: './work-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    FileSizePipe,
    ThemedAccessStatusBadgeComponent,
    ThemedFileDownloadLinkComponent,
    TranslateModule,
  ],
})
export class WorkAccessComponent implements OnInit, AfterViewInit {
  readonly item = input.required<Item>();
  /** Element id of the in-page reader, scrolled to by "Read here". */
  readonly readerId = input<string>();

  readonly floatingVisible = signal(false);
  readonly copied = signal(false);
  readonly canShare = signal(false);
  state$: Observable<WorkAccessState>;

  private readonly bitstreams = inject(BitstreamDataService);
  private readonly authorization = inject(AuthorizationDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly names = inject(DSONameService);
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');

  ngOnInit(): void {
    const item = this.item();
    this.state$ = this.bitstreams.findPrimaryBitstreamByItemAndName(item, 'ORIGINAL').pipe(
      catchError(() => of(null)),
      switchMap((primary) => primary ? of(primary) : this.firstOriginal(item)),
      switchMap((file) => file
        ? this.authorization.isAuthorized(FeatureID.CanDownload, file.self).pipe(
          take(1),
          catchError(() => of(false)),
          map((canDownload) => ({ file, canDownload, isPdf: isPdfName(this.names.getName(file)) })),
        )
        : of({ file: null, canDownload: false, isPdf: false })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    this.canShare.set(typeof navigator.share === 'function');
    const card = this.card()?.nativeElement;
    if (!card || typeof IntersectionObserver === 'undefined') {
      return;
    }
    // Show the compact download bar only after the card scrolled out above.
    const observer = new IntersectionObserver(([entry]) => {
      this.floatingVisible.set(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(card);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  get link(): string {
    const uris = this.item().allMetadataValues('dc.identifier.uri');
    return permanentLink(uris, this.isBrowser ? window.location.href : '');
  }

  copyLink(): void {
    if (!this.isBrowser || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(this.link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 4000);
    });
  }

  share(): void {
    if (this.canShare()) {
      void navigator.share({ title: this.names.getName(this.item()), url: this.link }).catch(() => undefined);
    }
  }

  openReader(): void {
    const id = this.readerId();
    const target = id && this.isBrowser ? document.getElementById(id) : null;
    if (!target) {
      return;
    }
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    target.focus({ preventScroll: true });
  }

  private firstOriginal(item: Item): Observable<Bitstream | null> {
    return this.bitstreams.findAllByItemAndBundleName(item, 'ORIGINAL', { elementsPerPage: 1, currentPage: 1 }).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.page?.[0] ?? null : null),
      catchError(() => of(null)),
    );
  }
}
