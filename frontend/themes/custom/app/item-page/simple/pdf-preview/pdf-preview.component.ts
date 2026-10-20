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
import { Subscription } from 'rxjs';

import { ThemedFileDownloadLinkComponent } from '../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import {
  PDF_VIEWER_PATH,
  PdfDocument,
} from './pdf-documents';
import { PdfPreviewService } from './pdf-preview.service';

@Component({
  selector: 'ds-pdf-preview',
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PdfPreviewService],
  imports: [
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
  state: 'loading' | 'ready' | 'restricted' | 'error' = 'loading';
  catalogState: 'loading' | 'ready' | 'error' = 'loading';
  previewUrl: SafeResourceUrl;

  private objectUrl: string;
  private catalogSubscription: Subscription;
  private previewSubscription: Subscription;

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
    this.state = 'loading';
    this.previewSubscription = this.previewService.loadDocument(this.selected.bitstream).subscribe({
      next: (blob) => {
        if (blob) {
          this.objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const viewer = new URL(PDF_VIEWER_PATH, this.document.baseURI);
          viewer.searchParams.set('file', this.objectUrl);
          viewer.searchParams.set('locale', this.translate.getCurrentLang() || 'pt-BR');
          viewer.hash = 'zoom=page-width&pagemode=none';
          // Only our local viewer and a locally created Blob URL are trusted here.
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewer.href);
          this.state = 'ready';
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

  ngOnDestroy(): void {
    this.catalogSubscription?.unsubscribe();
    this.clearPreview();
  }

  private clearPreview(): void {
    this.previewSubscription?.unsubscribe();
    this.previewUrl = undefined;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
