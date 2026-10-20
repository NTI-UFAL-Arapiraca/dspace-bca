import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, OnChanges } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { PaginationComponentOptions } from '@dspace/core/pagination/pagination-component-options.model';
import { HALEndpointService } from '@dspace/core/shared/hal-endpoint.service';
import { Item } from '@dspace/core/shared/item.model';
import { getFirstCompletedRemoteData } from '@dspace/core/shared/operators';
import { PaginatedSearchOptions } from '@dspace/core/shared/search/models/paginated-search-options.model';
import { SearchFilterConfig } from '@dspace/core/shared/search/models/search-filter-config.model';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, switchMap, take } from 'rxjs/operators';

import { SearchService } from '../../../../../../../app/shared/search/search.service';

const roles = ['works', 'authored', 'advised', 'coadvised', 'reviewed'];

@Component({
  selector: 'ds-person-activity',
  templateUrl: './person-activity.component.html',
  styleUrls: ['./person-profile.scss'],
  imports: [AsyncPipe, RouterLink, TranslateModule],
  // Facet requests update the service's applied-filter stream. Keep that state
  // separate from the sibling tabbed search and its user-selected filters.
  providers: [SearchService],
})
export class PersonActivityComponent implements OnChanges {
  @Input() item: Item;
  @Input() itemPageRoute: string;
  private search = inject(SearchService);
  private hal = inject(HALEndpointService);
  private router = inject(Router);
  counts$: Observable<{ role: string; count: number | null | undefined }[]>;
  context$: Observable<{ field: string; values: { label: string; count: number }[] }[]>;
  activeRole$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const tab = this.router.parseUrl(this.router.url).queryParams.tab;
      return typeof tab === 'string' && tab.startsWith('RELATION.Person.')
        ? tab.slice('RELATION.Person.'.length)
        : 'works';
    }),
  );

  ngOnChanges(): void {
    if (!this.item?.uuid) return;
    const options = (role: string) => new PaginatedSearchOptions({
      scope: this.item.uuid,
      configuration: `RELATION.Person.${role}`,
      pagination: Object.assign(new PaginationComponentOptions(), {currentPage: 1, pageSize: 1}),
    });
    this.counts$ = combineLatest(roles.map(role => this.search.search<Item>(options(role)).pipe(
      getFirstCompletedRemoteData(),
      map(rd => ({role, count: rd.hasSucceeded ? rd.payload.totalElements : null})),
      catchError(() => of({role, count: null})),
      startWith({role, count: undefined}),
    ))).pipe(shareReplay({bufferSize: 1, refCount: true}));

    this.context$ = this.hal.getEndpoint('discover/facets').pipe(
      take(1),
      switchMap(endpoint => combineLatest(['subject', 'course', 'campus'].map(field => {
        const filter = Object.assign(new SearchFilterConfig(), {
          name: field, pageSize: 6, _links: {self: {href: `${endpoint}/${field}`}},
        });
        return this.search.getFacetValuesFor(filter, 1, options('works')).pipe(
          getFirstCompletedRemoteData(),
          map(rd => ({field, values: rd.hasSucceeded ? rd.payload.page : []})),
          catchError(() => of({field, values: []})),
        );
      }))),
      shareReplay({bufferSize: 1, refCount: true}),
    );
  }

  filterParams(field: string, label: string): Record<string, string> {
    return {tab: 'RELATION.Person.works', [`f.${field}`]: `${label},equals`};
  }
}
