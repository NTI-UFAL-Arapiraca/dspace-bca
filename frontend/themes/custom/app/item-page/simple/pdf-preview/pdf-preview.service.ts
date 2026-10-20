import {
  HttpClient,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BitstreamDataService } from '@dspace/core/data/bitstream-data.service';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import { PaginatedList } from '@dspace/core/data/paginated-list.model';
import { Bitstream } from '@dspace/core/shared/bitstream.model';
import { followLink } from '@dspace/core/shared/follow-link-config.model';
import { Item } from '@dspace/core/shared/item.model';
import { getFirstCompletedRemoteData } from '@dspace/core/shared/operators';
import {
  catchError,
  defaultIfEmpty,
  EMPTY,
  expand,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  reduce,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import {
  PdfDocument,
  selectPdfDocuments,
} from './pdf-documents';
import { isValidPdfRange } from './pdf-preview-policy';

/** Uses the same ORIGINAL bundle and download permission as the file section. */
@Injectable()
export class PdfPreviewService {
  constructor(
    private bitstreams: BitstreamDataService,
    private authorization: AuthorizationDataService,
    private http: HttpClient,
  ) {}

  findDocuments(item: Item): Observable<PdfDocument[]> {
    const files$ = this.loadPage(item, 1).pipe(
      expand((page) => page.currentPage < page.totalPages ? this.loadPage(item, page.currentPage + 1) : EMPTY),
      reduce((files, page) => [...files, ...page.page], [] as Bitstream[]),
      switchMap((files) => files.length === 0 ? of([]) : forkJoin(files.map((bitstream) => bitstream.format
        ? bitstream.format.pipe(
          getFirstCompletedRemoteData(),
          map((format) => ({ bitstream, mimetype: format?.payload?.mimetype })),
        )
        : of({ bitstream, mimetype: undefined }),
      ))),
    );
    const primary$ = this.bitstreams.findPrimaryBitstreamByItemAndName(item, 'ORIGINAL').pipe(
      defaultIfEmpty(null),
      catchError(() => of(null)),
    );
    return forkJoin([files$, primary$]).pipe(
      map(([files, primary]) => selectPdfDocuments(files, primary?.id)),
    );
  }

  canPreview(bitstream: Bitstream): Observable<boolean> {
    return this.authorization.isAuthorized(FeatureID.CanDownload, bitstream.self).pipe(take(1));
  }

  /** End is exclusive, matching PDFDataRangeTransport. Keep DSpace's auth interceptors. */
  loadRange(bitstream: Bitstream, begin: number, end: number): Observable<ArrayBuffer> {
    if (!isValidPdfRange(begin, end, bitstream.sizeBytes)) {
      return throwError(() => new Error('Invalid PDF byte range'));
    }
    return this.http.get(bitstream._links.content.href, {
      headers: { Range: `bytes=${begin}-${end - 1}` },
      responseType: 'arraybuffer',
      observe: 'events',
      reportProgress: true,
    }).pipe(
      tap((event) => {
        // Abort at headers if a proxy ignores Range, before buffering the whole file.
        if (event?.type === HttpEventType.ResponseHeader && event.status !== 206) {
          throw new Error('Partial PDF responses are unavailable');
        }
      }),
      filter((event): event is HttpResponse<ArrayBuffer> => event?.type === HttpEventType.Response),
      map((response) => {
        const contentRange = response.headers.get('Content-Range');
        if (response.status !== 206 || response.body?.byteLength !== end - begin
          || (contentRange && contentRange !== `bytes ${begin}-${end - 1}/${bitstream.sizeBytes}`)) {
          throw new Error('Unexpected partial PDF response');
        }
        return response.body;
      }),
      take(1),
    );
  }

  private loadPage(item: Item, currentPage: number): Observable<PaginatedList<Bitstream>> {
    return this.bitstreams.findAllByItemAndBundleName(item, 'ORIGINAL', {
      currentPage,
      elementsPerPage: 20,
    }, true, true, followLink('format')).pipe(
      getFirstCompletedRemoteData(),
      switchMap((result) => result.hasSucceeded
        ? of(result.payload)
        : throwError(() => new Error('Unable to load original files'))),
    );
  }
}
