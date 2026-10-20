import { HttpClient } from '@angular/common/http';
import { BitstreamDataService } from '@dspace/core/data/bitstream-data.service';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { RemoteData } from '@dspace/core/data/remote-data';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { BitstreamFormat } from '@dspace/core/shared/bitstream-format.model';
import { Item } from '@dspace/core/shared/item.model';
import {
  firstValueFrom,
  of,
  throwError,
} from 'rxjs';

import { PdfPreviewService } from './pdf-preview.service';

const completed = <T>(payload: T) => ({ hasCompleted: true, hasSucceeded: true, payload } as RemoteData<T>);
const file = (id: string, mimetype = 'application/pdf') => ({
  id,
  self: `https://repository.example/api/core/bitstreams/${id}`,
  _links: { content: { href: `https://repository.example/api/core/bitstreams/${id}/content` } },
  format: of(completed({ mimetype } as BitstreamFormat)),
} as Bitstream);

describe('PdfPreviewService', () => {
  let bitstreams: jasmine.SpyObj<BitstreamDataService>;
  let authorization: jasmine.SpyObj<AuthorizationDataService>;
  let http: jasmine.SpyObj<HttpClient>;
  let service: PdfPreviewService;

  beforeEach(() => {
    bitstreams = jasmine.createSpyObj('BitstreamDataService', ['findAllByItemAndBundleName', 'findPrimaryBitstreamByItemAndName']);
    authorization = jasmine.createSpyObj('AuthorizationDataService', ['isAuthorized']);
    http = jasmine.createSpyObj('HttpClient', ['get']);
    bitstreams.findPrimaryBitstreamByItemAndName.and.returnValue(of(null));
    service = new PdfPreviewService(bitstreams, authorization, http);
  });

  it('reads subsequent pages and selects the primary PDF even when it is on a later page', async () => {
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

  it('does not request file content when download permission is denied', async () => {
    authorization.isAuthorized.and.returnValue(of(false));
    expect(await firstValueFrom(service.loadDocument(file('restricted')))).toBeNull();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('loads authorized content using the supplied HAL link and a blob response', async () => {
    const document = file('public');
    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    authorization.isAuthorized.and.returnValue(of(true));
    http.get.and.returnValue(of(blob));
    expect(await firstValueFrom(service.loadDocument(document))).toBe(blob);
    expect(http.get).toHaveBeenCalledWith(document._links.content.href, jasmine.objectContaining({ responseType: 'blob' }));
  });

  it('propagates network errors so the component can offer a retry', async () => {
    authorization.isAuthorized.and.returnValue(of(true));
    http.get.and.returnValue(throwError(() => new Error('Network unavailable')));
    await expectAsync(firstValueFrom(service.loadDocument(file('public')))).toBeRejected();
  });
});
