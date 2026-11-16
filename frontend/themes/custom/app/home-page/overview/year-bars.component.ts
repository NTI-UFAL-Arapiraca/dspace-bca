import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  YearBar,
  yearSearchParams,
} from './year-series';

/** Number of columns at each end whose label is aligned to the chart edge. */
const EDGE_COLUMNS = 3;

/**
 * Works per publication year as columns linking to the works search of that
 * year. Each column spans the full chart height, so years with few works are
 * as easy to point at or tap as the busiest one; the year and count appear on
 * hover and focus. Used by the home page and by collection pages (`scope`).
 */
@Component({
  selector: 'ds-year-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="home-years__bars">
      @for (bar of bars(); track bar.year; let i = $index, total = $count) {
        <li>
          <a class="home-years__col" [routerLink]="['/search']" [queryParams]="params(bar.year)"
            [style.--bar]="bar.percent + '%'" [class.is-empty]="!bar.count"
            [class.is-start]="i < edge" [class.is-end]="i >= total - edge"
            [attr.aria-label]="'repository.home.explore.year-label' | translate: { year: bar.year, count: bar.count }">
            <span class="home-years__bar"></span>
            <span class="home-years__tip" aria-hidden="true">{{ 'repository.home.explore.year-label' | translate: { year: bar.year, count: bar.count } }}</span>
          </a>
        </li>
      }
    </ol>
  `,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class YearBarsComponent {
  readonly bars = input.required<YearBar[]>();
  /** Limits the linked search to a community or collection. */
  readonly scope = input<string>();

  readonly edge = EDGE_COLUMNS;

  params(year: number): Record<string, string> {
    const scope = this.scope();
    return scope ? { ...yearSearchParams(year), scope } : yearSearchParams(year);
  }
}
