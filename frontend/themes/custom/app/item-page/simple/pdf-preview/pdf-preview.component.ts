import {
  isPlatformBrowser,
  NgTemplateOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';
import { DSONameService } from '@dspace/core/breadcrumbs/dso-name.service';
import { Item } from '@dspace/core/shared/item.model';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  firstValueFrom,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from 'rxjs';

import { ThemedFileDownloadLinkComponent } from '../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { FileSizePipe } from '../../../../../../app/shared/utils/file-size-pipe';
import {
  PDF_VIEWER_PATH,
  PdfDocument,
} from './pdf-documents';
import { splitPdfFilename } from './pdf-filename';
import { PdfPreviewService } from './pdf-preview.service';
import {
  getPdfPreviewGate,
  PdfConnectionInfo,
  PdfPreviewGate,
} from './pdf-preview-policy';
import {
  PdfViewerBridge,
  PdfViewerWindow,
} from './pdf-viewer-source';

@Component({
  selector: 'ds-pdf-preview',
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PdfPreviewService],
  imports: [
    FileSizePipe,
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLinkButton,
    NgbNavOutlet,
    NgTemplateOutlet,
    ThemedFileDownloadLinkComponent,
    TranslateModule,
  ],
})
export class PdfPreviewComponent implements OnChanges, OnDestroy {
  @Input() item: Item;

  documents: PdfDocument[] = [];
  selected: PdfDocument;
  state: 'deferred' | 'loading' | 'ready' | 'restricted' | 'error' = 'loading';
  catalogState: 'loading' | 'ready' | 'error' = 'loading';
  previewUrl: SafeResourceUrl;
  gate: PdfPreviewGate;
  loadedBytes = 0;
  readonly filenameParts = splitPdfFilename;

  private catalogSubscription: Subscription;
  private previewSubscription: Subscription;
  private cancelPreview = new Subject<void>();
  private viewer: PdfViewerBridge;
  private selection = 0;

  constructor(
    private previewService: PdfPreviewService,
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    private translate: TranslateService,
    public names: DSONameService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnChanges(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.catalogSubscription?.unsubscribe();
    this.clearPreview();
    this.documents = [];
    this.selected = undefined;
    this.catalogState = 'loading';
    if (!this.item || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.catalogSubscription = this.previewService.findDocuments(this.item).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.catalogState = 'ready';
        if (documents.length > 0) {
          this.selectDocument(documents[0].bitstream.id);
        }
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.catalogState = 'error';
        this.changeDetector.markForCheck();
      },
    });
  }

  selectDocument(id: string): void {
    this.clearPreview();
    this.selected = this.documents.find((document) => document.bitstream.id === id);
    if (!this.selected) {
      return;
    }
    const navigator = this.document.defaultView?.navigator as Navigator & { connection?: PdfConnectionInfo };
    this.gate = getPdfPreviewGate(this.selected.bitstream.sizeBytes, navigator?.connection);
    this.state = 'deferred';
    if (!this.gate) {
      this.startPreview();
    }
  }

  startPreview(): void {
    this.clearPreview();
    this.state = 'loading';
    this.previewSubscription = this.previewService.canPreview(this.selected.bitstream).subscribe({
      next: (allowed) => {
        if (allowed) {
          const viewer = new URL(PDF_VIEWER_PATH, this.document.baseURI);
          viewer.searchParams.set('locale', this.translate.getCurrentLang() || 'pt-BR');
          viewer.hash = 'zoom=page-width&pagemode=none';
          // Trust only our same-origin viewer. No content URL or token enters the iframe.
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewer.href);
        } else {
          this.state = 'restricted';
        }
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.state = 'error';
        this.changeDetector.markForCheck();
      },
    });
  }

  connectViewer(event: Event): void {
    const frame = event.target as HTMLIFrameElement;
    // Some browsers emit a load for the iframe's initial empty document.
    if (frame.contentWindow?.location?.href === 'about:blank') {
      return;
    }
    const viewer = (frame.contentWindow as PdfViewerWindow)?.repositoryPdfViewer;
    if (!viewer) {
      this.failPreview();
      return;
    }
    this.viewer = viewer;
    const selection = this.selection;
    const bitstream = this.selected.bitstream;
    void viewer.open({
      length: bitstream.sizeBytes,
      filename: this.names.getName(bitstream),
      readRange: (begin, end) => {
        if (selection !== this.selection) {
          return Promise.reject(new Error('PDF preview was closed'));
        }
        return firstValueFrom(this.previewService.loadRange(bitstream, begin, end).pipe(
          tap((buffer) => {
            this.loadedBytes += buffer.byteLength;
            this.changeDetector.markForCheck();
          }),
          takeUntil(this.cancelPreview),
        ));
      },
      onReady: () => {
        if (selection === this.selection) {
          this.state = 'ready';
          this.changeDetector.markForCheck();
        }
      },
      onError: () => {
        if (selection === this.selection) {
          this.failPreview();
        }
      },
    }).catch(() => {
      if (selection === this.selection) {
        this.failPreview();
      }
    });
  }

  stopPreview(): void {
    this.clearPreview();
    this.gate = 'paused';
    this.state = 'deferred';
  }

  ngOnDestroy(): void {
    this.catalogSubscription?.unsubscribe();
    this.clearPreview();
    this.cancelPreview.complete();
  }

  private clearPreview(): void {
    this.selection++;
    this.previewSubscription?.unsubscribe();
    this.cancelPreview.next();
    this.viewer?.close();
    this.viewer = undefined;
    this.previewUrl = undefined;
    this.loadedBytes = 0;
  }

  private failPreview(): void {
    this.clearPreview();
    this.state = 'error';
    this.changeDetector.markForCheck();
  }
}
