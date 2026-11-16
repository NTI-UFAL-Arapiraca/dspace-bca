import {
  AsyncPipe,
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  map,
} from 'rxjs';

import {
  AGGREGATES_CONFIGURATION,
  HomeOverviewService,
} from './home-overview.service';
import { yearSeries } from './year-series';

/** The collection in numbers: works, courses, people and first year. */
@Component({
  selector: 'ds-home-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stats$ | async; as stats) {
      @if (stats.works) {
        <dl class="home-stats" [attr.aria-label]="'repository.home.stats.label' | translate">
          <div><dt>{{ 'repository.home.stats.works' | translate }}</dt><dd>{{ stats.works | number }}</dd></div>
          @if (stats.courses) {
            <div><dt>{{ 'repository.home.stats.courses' | translate }}</dt><dd>{{ stats.courses }}{{ stats.moreCourses ? '+' : '' }}</dd></div>
          }
          @if (stats.people) {
            <div><dt>{{ 'repository.home.stats.people' | translate }}</dt><dd>{{ stats.people | number }}</dd></div>
          }
          @if (stats.firstYear) {
            <div><dt>{{ 'repository.home.stats.first-year' | translate }}</dt><dd>{{ stats.firstYear }}</dd></div>
          }
        </dl>
      }
    }
  `,
  imports: [
    AsyncPipe,
    DecimalPipe,
    TranslateModule,
  ],
})
export class HomeStatsComponent {
  private static readonly COURSE_PAGE = 100;
  private readonly overview = inject(HomeOverviewService);

  readonly stats$ = combineLatest({
    works: this.overview.total(AGGREGATES_CONFIGURATION),
    people: this.overview.total('person'),
    courses: this.overview.facet('course', HomeStatsComponent.COURSE_PAGE),
    years: this.overview.facet('publicationYear', 100),
  }).pipe(
    map(({ works, people, courses, years }) => ({
      works,
      people,
      courses: courses.length,
      moreCourses: courses.length >= HomeStatsComponent.COURSE_PAGE,
      firstYear: yearSeries(years, Number.MAX_SAFE_INTEGER)[0]?.year,
    })),
  );
}
