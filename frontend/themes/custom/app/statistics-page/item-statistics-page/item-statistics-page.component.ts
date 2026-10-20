import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { ItemStatisticsPageComponent as BaseComponent } from '../../../../../app/statistics-page/item-statistics-page/item-statistics-page.component';
import { StatisticsDashboardComponent } from '../statistics-page/statistics-dashboard.component';
import { StatisticsScope } from '../statistics-page/statistics-dashboard.helpers';

@Component({
  selector: 'ds-themed-item-statistics-page',
  templateUrl: '../statistics-page/statistics-dashboard-page.component.html',
  styleUrls: ['../statistics-page/statistics-dashboard-page.component.scss'],
  imports: [
    AsyncPipe,
    StatisticsDashboardComponent,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class ItemStatisticsPageComponent extends BaseComponent {
  readonly scopeKind: StatisticsScope = 'item';
}
