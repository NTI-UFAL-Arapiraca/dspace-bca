import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { CollectionStatisticsPageComponent as BaseComponent } from '../../../../../app/statistics-page/collection-statistics-page/collection-statistics-page.component';
import { StatisticsDashboardComponent } from '../statistics-page/statistics-dashboard.component';
import { StatisticsScope } from '../statistics-page/statistics-dashboard.helpers';

@Component({
  selector: 'ds-themed-collection-statistics-page',
  templateUrl: '../statistics-page/statistics-dashboard-page.component.html',
  styleUrls: ['../statistics-page/statistics-dashboard-page.component.scss'],
  imports: [
    AsyncPipe,
    StatisticsDashboardComponent,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class CollectionStatisticsPageComponent extends BaseComponent {
  readonly scopeKind: StatisticsScope = 'collection';
}
