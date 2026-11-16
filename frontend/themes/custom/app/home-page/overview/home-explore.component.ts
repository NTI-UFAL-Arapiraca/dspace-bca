import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';

import { workFilterParams } from '../../item-page/simple/work/work-context';
import { HomeOverviewService } from './home-overview.service';
import { YearBarsComponent } from './year-bars.component';
import { yearSeries } from './year-series';

/**
 * Ways into the collection for visitors without a query: by course, by type
 * and by publication year. Every entry is a link to the filtered search.
 */
@Component({
  selector: 'ds-home-explore',
  templateUrl: './home-explore.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterLink,
    TranslateModule,
    YearBarsComponent,
  ],
})
export class HomeExploreComponent {
  private readonly overview = inject(HomeOverviewService);

  readonly courses$ = this.overview.facet('course', 8);
  readonly types$ = this.overview.facet('itemtype', 6);
  readonly years$ = this.overview.facet('publicationYear', 100).pipe(map((values) => yearSeries(values)));

  courseParams(value: string): Record<string, string> {
    return workFilterParams('course', value);
  }

  typeParams(value: string): Record<string, string> {
    return { 'configuration': 'academic_works_search', 'f.itemtype': `${value},equals` };
  }
}
