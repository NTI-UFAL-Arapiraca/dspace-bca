import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AuthService } from '@dspace/core/auth/auth.service';
import { DSONameService } from '@dspace/core/breadcrumbs/dso-name.service';
import { LocaleService } from '@dspace/core/locale/locale.service';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import {
  BehaviorSubject,
  Observable,
  of,
  throwError,
} from 'rxjs';

import { ThemedFileDownloadLinkComponent } from '../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { PdfPreviewComponent } from './pdf-preview.component';
import { PdfPreviewService } from './pdf-preview.service';
import { PdfViewerSource } from './pdf-viewer-source';

describe('PdfPreviewComponent', () => {
  let fixture: ComponentFixture<PdfPreviewComponent>;
  let service: jasmine.SpyObj<PdfPreviewService>;
  let bridge: { open: jasmine.Spy; close: jasmine.Spy };
  let source: PdfViewerSource;
  let user: BehaviorSubject<string>;
  let connection: PropertyDescriptor | undefined;
  const documents = ['main', 'appendix'].map((id, index) => ({
    bitstream: { id, name: `${id}.pdf`, sizeBytes: 1000 } as Bitstream,
    isPrimary: index === 0,
  }));
  const connect = () => fixture.componentInstance.connectViewer({
    target: { contentWindow: { repositoryPdfViewer: bridge } },
  } as unknown as Event);

  beforeEach(async () => {
    connection = Object.getOwnPropertyDescriptor(navigator, 'connection');
    Object.defineProperty(navigator, 'connection', {
      configurable: true, value: { saveData: false, effectiveType: '4g', downlink: 10 },
    });
    user = new BehaviorSubject<string>(null);
    service = jasmine.createSpyObj('PdfPreviewService', ['findDocuments', 'canPreview', 'loadRange', 'clearCache', 'transferredBytes']);
    service.findDocuments.and.returnValue(of(documents));
    service.canPreview.and.returnValue(of(true));
    service.loadRange.and.returnValue(of(new ArrayBuffer(100)));
    service.transferredBytes.and.returnValue(0);
    bridge = {
      open: jasmine.createSpy('open').and.callFake(async (value: PdfViewerSource) => {
        source = value;
        source.onReady();
      }),
      close: jasmine.createSpy('close'),
    };
    await TestBed.configureTestingModule({
      imports: [PdfPreviewComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: { getAuthenticatedUserIdFromStore: () => user } },
        { provide: DSONameService, useValue: { getName: (bitstream) => bitstream.name } },
        { provide: LocaleService, useValue: { getCurrentLanguageCode: () => of('pt-BR') } },
      ],
    }).overrideComponent(PdfPreviewComponent, {
      remove: {
        providers: [PdfPreviewService],
        imports: [ThemedFileDownloadLinkComponent],
      },
      add: {
        providers: [{ provide: PdfPreviewService, useValue: service }],
        imports: [MockComponent(ThemedFileDownloadLinkComponent)],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(PdfPreviewComponent);
    fixture.componentRef.setInput('item', { id: 'item' } as Item);
  });

  afterEach(() => {
    fixture?.destroy();
    if (connection) {
      Object.defineProperty(navigator, 'connection', connection);
    } else {
      Reflect.deleteProperty(navigator, 'connection');
    }
  });

  it('shows filename tabs and closes the old viewer when switching', () => {
    fixture.detectChanges();
    connect();
    const tabs: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('main.pdf');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    const firstDownload = fixture.debugElement.query(By.css('header ds-file-download-link')).componentInstance;
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected.bitstream.id).toBe('appendix');
    expect(bridge.close).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('iframe').length).toBe(1);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    const selectedDownload = fixture.debugElement.query(By.css('header ds-file-download-link')).componentInstance;
    expect(selectedDownload.bitstream).toBe(documents[1].bitstream);
    expect(selectedDownload).not.toBe(firstDownload);
  });

  it('hides the section when there are no PDFs', () => {
    service.findDocuments.and.returnValue(of([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(service.canPreview).not.toHaveBeenCalled();
  });

  it('selects the primary PDF by default and switches the reader and download through the native picker', () => {
    fixture.detectChanges();
    connect();
    const picker: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(picker.value).toBe('main');
    expect(Array.from(picker.options, (option) => option.value)).toEqual(['main', 'appendix']);
    expect(picker.options[0].textContent).toContain('item.page.bitstreams.primary');
    expect(fixture.nativeElement.querySelector(`label[for="${picker.id}"]`)).not.toBeNull();
    const firstDownload = fixture.debugElement.query(By.css('header ds-file-download-link')).componentInstance;

    picker.value = 'appendix';
    picker.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.selected.bitstream).toBe(documents[1].bitstream);
    expect(bridge.close).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('iframe').length).toBe(1);
    expect(picker.title).toBe('appendix.pdf');
    const selectedDownload = fixture.debugElement.query(By.css('header ds-file-download-link')).componentInstance;
    expect(selectedDownload.bitstream).toBe(documents[1].bitstream);
    expect(selectedDownload).not.toBe(firstDownload);
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true');

    fixture.nativeElement.querySelector('[role="tab"]').click();
    fixture.detectChanges();
    expect(picker.value).toBe('main');
  });

  it('shows one PDF without tabs or a native picker', () => {
    service.findDocuments.and.returnValue(of([documents[0]]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('iframe').length).toBe(1);
    expect(fixture.componentInstance.selected.bitstream).toBe(documents[0].bitstream);
  });

  it('ignores an initial about:blank iframe load', () => {
    fixture.detectChanges();
    fixture.componentInstance.connectViewer({
      target: { contentWindow: { location: { href: 'about:blank' } } },
    } as unknown as Event);
    expect(fixture.componentInstance.state).toBe('loading');
    expect(fixture.componentInstance.previewUrl).toBeDefined();
  });

  it('keeps the viewer visible while loading so its password prompt remains usable', () => {
    fixture.detectChanges();
    const frame: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(fixture.componentInstance.state).toBe('loading');
    expect(frame.hidden).toBeFalse();
    expect(getComputedStyle(frame).visibility).toBe('visible');
  });

  it('does not create a viewer or request bytes for restricted content', () => {
    service.canPreview.and.returnValue(of(false));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.restricted');
    expect(service.loadRange).not.toHaveBeenCalled();
  });

  it('leaves a large PDF unloaded until explicitly requested, with a download link', () => {
    service.findDocuments.and.returnValue(of([{
      ...documents[0], bitstream: { ...documents[0].bitstream, sizeBytes: 30 * 1024 * 1024 } as Bitstream,
    }]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.gate.large');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('ds-file-download-link')).not.toBeNull();
    expect(service.canPreview).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('.pdf-preview__reader button').click();
    fixture.detectChanges();
    expect(service.canPreview).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
    expect(service.loadRange).not.toHaveBeenCalled();
  });

  it('offers a retry after a range error, keeping the download link', () => {
    fixture.detectChanges();
    connect();
    source.onError();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.error');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('ds-file-download-link')).not.toBeNull();
    fixture.nativeElement.querySelector('.pdf-preview__reader button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
  });

  it('handles permission lookup failures', () => {
    service.canPreview.and.returnValue(throwError(() => new Error('Unavailable')));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.error');
    expect(service.loadRange).not.toHaveBeenCalled();
  });

  it('counts bytes actually transferred through the authenticated service', async () => {
    fixture.detectChanges();
    connect();
    service.transferredBytes.and.returnValue(100);
    await source.readRange(0, 100);
    expect(service.loadRange).toHaveBeenCalledWith(documents[0].bitstream, 0, 100);
    expect(fixture.componentInstance.loadedBytes).toBe(100);
  });

  it('retains the byte cache across A/B switches and clears it on item change and teardown', () => {
    fixture.detectChanges();
    service.clearCache.calls.reset();
    fixture.componentInstance.selectDocument('appendix');
    fixture.componentInstance.selectDocument('main');
    fixture.componentInstance.selectDocument('appendix');
    expect(service.clearCache).not.toHaveBeenCalled();
    fixture.componentRef.setInput('item', { id: 'other-item' } as Item);
    fixture.detectChanges();
    expect(service.clearCache).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(service.clearCache).toHaveBeenCalledTimes(2);
  });

  it('clears cached bytes and closes the active reader when the authenticated user changes', () => {
    fixture.detectChanges();
    connect();
    service.clearCache.calls.reset();
    user.next('another-user');
    expect(bridge.close).toHaveBeenCalled();
    expect(service.clearCache).toHaveBeenCalledTimes(1);
    user.next(null);
    expect(service.clearCache).toHaveBeenCalledTimes(2);
  });

  it('does not ask for a large PDF to be opened again after switching away and back', () => {
    service.findDocuments.and.returnValue(of(documents.map((document) => ({
      ...document, bitstream: { ...document.bitstream, sizeBytes: 30 * 1024 * 1024 } as Bitstream,
    }))));
    fixture.detectChanges();
    fixture.componentInstance.startPreview();
    fixture.componentInstance.selectDocument('appendix');
    expect(fixture.componentInstance.state).toBe('deferred');
    fixture.componentInstance.selectDocument('main');
    expect(fixture.componentInstance.previewUrl).toBeDefined();
    expect(fixture.componentInstance.state).toBe('loading');
  });

  it('cancels active ranges and ignores stale viewer callbacks when closing', async () => {
    let cancelled = 0;
    service.loadRange.and.returnValue(new Observable<ArrayBuffer>(() => () => cancelled++));
    fixture.detectChanges();
    connect();
    const oldSource = source;
    const result = oldSource.readRange(0, 100);
    const rejection = expectAsync(result).toBeRejected();
    fixture.componentInstance.stopPreview();
    await rejection;
    oldSource.onReady();
    oldSource.onError();
    fixture.detectChanges();
    expect(cancelled).toBe(1);
    expect(fixture.componentInstance.state).toBe('deferred');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    await expectAsync(oldSource.readRange(0, 100)).toBeRejectedWithError('PDF preview was closed');
  });

  it('cancels ranges on teardown', async () => {
    let cancelled = false;
    service.loadRange.and.returnValue(new Observable<ArrayBuffer>(() => () => cancelled = true));
    fixture.detectChanges();
    connect();
    const rejection = expectAsync(source.readRange(0, 100)).toBeRejected();
    fixture.destroy();
    await rejection;
    expect(cancelled).toBeTrue();
  });
});
