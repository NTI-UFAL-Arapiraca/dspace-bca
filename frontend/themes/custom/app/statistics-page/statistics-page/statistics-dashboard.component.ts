import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getEntityPageRoute } from '@dspace/core/router/utils/dso-route.utils';
import { UsageReport } from '@dspace/core/statistics/models/usage-report.model';
import { TranslateModule } from '@ngx-translate/core';

import {
  buildStatisticsDashboard,
  StatisticsDashboard,
  StatisticsScope,
} from './statistics-dashboard.helpers';

/** Presents existing REST usage reports without deriving a repository-wide total. */
@Component({
  selector: 'ds-statistics-dashboard',
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
  ],
})
export class StatisticsDashboardComponent implements OnChanges {
  @Input({ required: true }) reports: UsageReport[] = [];
  @Input({ required: true }) scope: StatisticsScope;
  @Input({ required: true }) scopeId: string;

  dashboard: StatisticsDashboard;

  ngOnChanges(): void {
    this.dashboard = buildStatisticsDashboard(this.reports ?? [], this.scope, this.scopeId);
  }

  itemRoute(id: string): string {
    return getEntityPageRoute(undefined, id);
  }

  headerKey(header: string): string | null {
    return header === 'views' || header === 'downloads' ? `statistics.table.header.${header}` : null;
  }
}
