import {
  HttpClient,
  HttpHeaderResponse,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BitstreamDataService } from '@dspace/core/data/bitstream-data.service';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { RemoteData } from '@dspace/core/data/remote-data';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { BitstreamFormat } from '@dspace/core/shared/bitstream-format.model';
import { Item } from '@dspace/core/shared/item.model';
import {
  firstValueFrom,
  of,
} from 'rxjs';

import { PdfPreviewService } from './pdf-preview.service';

const completed = <T>(payload: T) => ({ hasCompleted: true, hasSucceeded: true, payload } as RemoteData<T>);
const file = (id: string, mimetype = 'application/pdf') => ({
  id,
  sizeBytes: 1000,
  self: `https://repository.example/api/core/bitstreams/${id}`,
  _links: { content: { href: `https://repository.example/api/core/bitstreams/${id}/content` } },
  format: of(completed({ mimetype } as BitstreamFormat)),
} as Bitstream);

describe('PdfPreviewService', () => {
  let bitstreams: jasmine.SpyObj<BitstreamDataService>;
  let authorization: jasmine.SpyObj<AuthorizationDataService>;
  let http: HttpTestingController;
  let service: PdfPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    bitstreams = jasmine.createSpyObj('BitstreamDataService', ['findAllByItemAndBundleName', 'findPrimaryBitstreamByItemAndName']);
    authorization = jasmine.createSpyObj('AuthorizationDataService', ['isAuthorized']);
    bitstreams.findPrimaryBitstreamByItemAndName.and.returnValue(of(null));
    service = new PdfPreviewService(bitstreams, authorization, TestBed.inject(HttpClient));
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads subsequent pages and promotes the primary PDF even on a later page', async () => {
    bitstreams.findAllByItemAndBundleName.and.callFake((_item, bundle, options) => {
      expect(bundle).toBe('ORIGINAL');
      return of(completed({
        page: options.currentPage === 1 ? [file('appendix'), file('image', 'image/png')] : [file('main')],
        currentPage: options.currentPage,
        totalPages: 2,
      } as any));
    });
    bitstreams.findPrimaryBitstreamByItemAndName.and.returnValue(of(file('main')));
    const documents = await firstValueFrom(service.findDocuments({ id: 'item' } as Item));
    expect(documents.map(({ bitstream }) => bitstream.id)).toEqual(['main', 'appendix']);
    expect(documents[0].isPrimary).toBeTrue();
    expect(bitstreams.findAllByItemAndBundleName).toHaveBeenCalledTimes(2);
  });

  it('checks permission without requesting content', async () => {
    authorization.isAuthorized.and.returnValue(of(false));
    expect(await firstValueFrom(service.canPreview(file('restricted')))).toBeFalse();
    http.expectNone(() => true);
  });

  it('requests an exclusive-end range through the HAL content link', async () => {
    const document = file('public');
    const result = firstValueFrom(service.loadRange(document, 100, 200));
    const request = http.expectOne(document._links.content.href);
    expect(request.request.headers.get('Range')).toBe('bytes=100-199');
    expect(request.request.responseType).toBe('arraybuffer');
    request.flush(new ArrayBuffer(100), { status: 206, statusText: 'Partial Content', headers: { 'Content-Range': 'bytes 100-199/1000' } });
    expect((await result).byteLength).toBe(100);
  });

  it('works when CORS does not expose Content-Range, verifying status and byte count', async () => {
    const result = firstValueFrom(service.loadRange(file('public'), 0, 100));
    http.expectOne(() => true).flush(new ArrayBuffer(100), { status: 206, statusText: 'Partial Content' });
    expect((await result).byteLength).toBe(100);
  });

  it('aborts at response headers when a server ignores Range', async () => {
    const result = firstValueFrom(service.loadRange(file('public'), 0, 100));
    const rejection = expectAsync(result).toBeRejectedWithError('Partial PDF responses are unavailable');
    const request = http.expectOne(() => true);
    request.event(new HttpHeaderResponse({ status: 200 }));
    await rejection;
    expect(request.cancelled).toBeTrue();
  });

  it('rejects truncated or mismatched ranges rather than passing corrupt bytes to PDF.js', async () => {
    for (const [length, contentRange] of [[90, 'bytes 0-99/1000'], [100, 'bytes 100-199/1000']] as const) {
      const result = firstValueFrom(service.loadRange(file('public'), 0, 100));
      const rejection = expectAsync(result).toBeRejectedWithError('Unexpected partial PDF response');
      http.expectOne(() => true).flush(new ArrayBuffer(length), {
        status: 206, statusText: 'Partial Content', headers: { 'Content-Range': contentRange },
      });
      await rejection;
    }
  });

  it('rejects invalid bounds without an HTTP request', async () => {
    await expectAsync(firstValueFrom(service.loadRange(file('public'), 0, 1001))).toBeRejectedWithError('Invalid PDF byte range');
    http.expectNone(() => true);
  });

  it('cancels the HTTP request on unsubscribe', () => {
    const subscription = service.loadRange(file('public'), 0, 100).subscribe();
    const request = http.expectOne(() => true);
    subscription.unsubscribe();
    expect(request.cancelled).toBeTrue();
  });
});
