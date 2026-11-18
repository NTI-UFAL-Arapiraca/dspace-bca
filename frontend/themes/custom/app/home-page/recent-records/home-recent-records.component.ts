import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SortDirection,
  SortOptions,
} from '@dspace/core/cache/models/sort-options.model';
import { PaginatedList } from '@dspace/core/data/paginated-list.model';
import { RemoteData } from '@dspace/core/data/remote-data';
import { getItemPageRoute } from '@dspace/core/router/utils/dso-route.utils';
import { DSpaceObjectType } from '@dspace/core/shared/dspace-object-type.model';
import { Item } from '@dspace/core/shared/item.model';
import { toDSpaceObjectListRD } from '@dspace/core/shared/operators';
import { PaginatedSearchOptions } from '@dspace/core/shared/search/models/paginated-search-options.model';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { RecentItemListComponent } from '../../../../../app/home-page/recent-item-list/recent-item-list.component';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { SearchService } from '../../../../../app/shared/search/search.service';
import { workContext } from '../../item-page/simple/work/work-context';
import { WorkContributorsComponent } from '../../shared/work-contributors/work-contributors.component';
import { AGGREGATES_CONFIGURATION } from '../overview/home-overview.service';

/**
 * Recently added works. Queries the works-only aggregates configuration so
 * Person profiles never appear as news (RFC 0026); pagination stays upstream.
 */
@Component({
  selector: 'ds-home-recent-records',
  templateUrl: './home-recent-records.component.html',
  styleUrls: ['./home-recent-records.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ErrorComponent,
    RouterLink,
    ThemedLoadingComponent,
    TranslateModule,
    WorkContributorsComponent,
  ],
})
export class HomeRecentRecordsComponent extends RecentItemListComponent implements OnInit {
  private readonly search = inject(SearchService);
  protected readonly itemRoute = getItemPageRoute;
  protected readonly work = (item: Item) => workContext(item.metadata);

  ngOnInit(): void {
    this.itemRD$ = this.search.search(new PaginatedSearchOptions({
      configuration: AGGREGATES_CONFIGURATION,
      pagination: this.paginationConfig,
      sort: new SortOptions('dc.date.accessioned', SortDirection.DESC),
      dsoTypes: [DSpaceObjectType.ITEM],
    })).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;
  }
}
