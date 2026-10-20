import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { DSONameService } from '@dspace/core/breadcrumbs/dso-name.service';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import {
  Observable,
  of,
  throwError,
} from 'rxjs';

import { ThemedFileDownloadLinkComponent } from '../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { PdfPreviewComponent } from './pdf-preview.component';
import { PdfPreviewService } from './pdf-preview.service';

describe('PdfPreviewComponent', () => {
  let fixture: ComponentFixture<PdfPreviewComponent>;
  let service: jasmine.SpyObj<PdfPreviewService>;
  let revoke: jasmine.Spy;
  const documents = ['main', 'appendix'].map((id, index) => ({
    bitstream: { id, name: `${id}.pdf` } as Bitstream,
    isPrimary: index === 0,
  }));

  beforeEach(async () => {
    service = jasmine.createSpyObj('PdfPreviewService', ['findDocuments', 'loadDocument']);
    service.findDocuments.and.returnValue(of(documents));
    service.loadDocument.and.returnValue(of(new Blob(['%PDF-1.7'])));
    spyOn(URL, 'createObjectURL').and.returnValues('blob:first', 'blob:second', 'blob:third');
    revoke = spyOn(URL, 'revokeObjectURL');
    await TestBed.configureTestingModule({
      imports: [PdfPreviewComponent, TranslateModule.forRoot()],
      providers: [{ provide: DSONameService, useValue: { getName: (bitstream) => bitstream.name } }],
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

  afterEach(() => fixture?.destroy());

  it('shows filename tabs, switches the active PDF and releases the previous content', () => {
    fixture.detectChanges();
    const tabs: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('main.pdf');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected.bitstream.id).toBe('appendix');
    expect(service.loadDocument).toHaveBeenCalledWith(documents[1].bitstream);
    expect(revoke).toHaveBeenCalledWith('blob:first');
    expect(fixture.nativeElement.querySelectorAll('iframe').length).toBe(1);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('hides the entire section when there are no PDFs', () => {
    service.findDocuments.and.returnValue(of([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(service.loadDocument).not.toHaveBeenCalled();
  });

  it('does not create a viewer for restricted content', () => {
    service.loadDocument.and.returnValue(of(null));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.restricted');
  });

  it('shows a retry after a content error', () => {
    service.loadDocument.and.returnValue(throwError(() => new Error('Unavailable')));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('repository.pdf.error');
    service.loadDocument.and.returnValue(of(new Blob(['%PDF-1.7'])));
    fixture.nativeElement.querySelector('.pdf-preview__reader button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
  });

  it('cancels an unfinished download when changing files and on teardown', () => {
    let cancelled = 0;
    const response = new Observable<Blob>(() => () => cancelled++);
    service.loadDocument.and.returnValue(response);
    fixture.detectChanges();
    fixture.componentInstance.selectDocument('appendix');
    expect(cancelled).toBe(1);
    fixture.destroy();
    expect(cancelled).toBe(2);
  });
});
