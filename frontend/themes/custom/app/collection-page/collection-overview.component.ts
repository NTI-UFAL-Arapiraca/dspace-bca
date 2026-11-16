import {
  AsyncPipe,
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  map,
  switchMap,
} from 'rxjs';

import {
  AGGREGATES_CONFIGURATION,
  HomeOverviewService,
} from '../home-page/overview/home-overview.service';
import { YearBarsComponent } from '../home-page/overview/year-bars.component';
import { yearSeries } from '../home-page/overview/year-series';

/** Works in a collection: total, years covered and works per year. */
@Component({
  selector: 'ds-collection-overview',
  templateUrl: './collection-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    DecimalPipe,
    TranslateModule,
    YearBarsComponent,
  ],
})
export class CollectionOverviewComponent {
  readonly scope = input.required<string>();
  private readonly overview = inject(HomeOverviewService);

  readonly overview$ = toObservable(this.scope).pipe(
    switchMap((scope) => combineLatest({
      total: this.overview.total(AGGREGATES_CONFIGURATION, scope),
      years: this.overview.facet('publicationYear', 100, scope).pipe(map((values) => yearSeries(values))),
    })),
  );
}
