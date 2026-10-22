import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getItemPageRoute } from '@dspace/core/router/utils/dso-route.utils';
import { TranslateModule } from '@ngx-translate/core';

import { RecentItemListComponent } from '../../../../../app/home-page/recent-item-list/recent-item-list.component';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';

/** Compact home preview; querying, ordering and pagination remain upstream. */
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
  ],
})
export class HomeRecentRecordsComponent extends RecentItemListComponent {
  protected readonly itemRoute = getItemPageRoute;
}
