import {
  inject,
  Injectable,
} from '@angular/core';
import { PaginationComponentOptions } from '@dspace/core/pagination/pagination-component-options.model';
import { HALEndpointService } from '@dspace/core/shared/hal-endpoint.service';
import { getFirstCompletedRemoteData } from '@dspace/core/shared/operators';
import { FacetValue } from '@dspace/core/shared/search/models/facet-value.model';
import { PaginatedSearchOptions } from '@dspace/core/shared/search/models/paginated-search-options.model';
import { SearchFilterConfig } from '@dspace/core/shared/search/models/search-filter-config.model';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';

import { SearchService } from '../../../../../app/shared/search/search.service';

/** Discovery configuration used only for overviews (RFC 0025/0026). */
export const AGGREGATES_CONFIGURATION = 'academic_works_aggregates';

/**
 * Totals and facet counts for the home page, read from the existing
 * Discovery endpoints. Failures resolve to empty values so the page degrades
 * to its links instead of erroring.
 */
@Injectable({ providedIn: 'root' })
export class HomeOverviewService {
  private readonly searchService = inject(SearchService);
  private readonly halService = inject(HALEndpointService);

  /** Number of results of a configuration (works or people), optionally in a scope. */
  total(configuration: string, scope?: string): Observable<number | null> {
    const options = new PaginatedSearchOptions({
      configuration,
      scope,
      pagination: Object.assign(new PaginationComponentOptions(), { id: `home-total-${configuration}-${scope ?? 'all'}`, currentPage: 1, pageSize: 1 }),
    });
    return this.searchService.search(options).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Values of one facet, up to `size`. Defaults to the aggregates
   * configuration; the facet must be a sidebar facet of `configuration`.
   */
  facet(name: string, size: number, scope?: string, configuration = AGGREGATES_CONFIGURATION): Observable<FacetValue[]> {
    return this.halService.getEndpoint('discover').pipe(
      take(1),
      switchMap((discover) => {
        const config = Object.assign(new SearchFilterConfig(), {
          name,
          pageSize: size,
          _links: { self: { href: `${discover}/facets/${name}` } },
        });
        const options = new PaginatedSearchOptions({
          configuration,
          scope,
          pagination: Object.assign(new PaginationComponentOptions(), { id: `home-facet-${configuration}-${name}-${scope ?? 'all'}`, currentPage: 1, pageSize: size }),
        });
        return this.searchService.getFacetValuesFor(config, 1, options);
      }),
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.page ?? [] : []),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
