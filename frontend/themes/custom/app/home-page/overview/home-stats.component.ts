import {
  AsyncPipe,
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  map,
} from 'rxjs';

import { WORKS_SEARCH_CONFIGURATION } from '../../item-page/simple/work/work-context';
import {
  AGGREGATES_CONFIGURATION,
  HomeOverviewService,
} from './home-overview.service';
import { yearSeries } from './year-series';

/**
 * Right side of the home opening: the collection in numbers. Works, courses
 * and people are links to where they can be browsed; on wide screens a quiet
 * line of works per year closes the panel. Every block hides when its data
 * is unavailable, and the whole panel when there are no works.
 */
@Component({
  selector: 'ds-home-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stats$ | async; as stats) {
      @if (stats.works) {
        <section class="home-stats" aria-labelledby="home-stats-title">
          <h2 id="home-stats-title" class="ufal-label">{{ 'repository.home.stats.label' | translate }}</h2>
          <ul class="home-stats__grid">
            <li>
              <a class="home-stats__item" [routerLink]="['/search']" [queryParams]="worksParams">
                <span class="home-stats__value">{{ stats.works | number }}</span>
                <span class="home-stats__name">{{ 'repository.home.stats.works' | translate }}</span>
              </a>
            </li>
            @if (stats.courses) {
              <li>
                <a class="home-stats__item" routerLink="/community-list">
                  <span class="home-stats__value">{{ stats.courses }}{{ stats.moreCourses ? '+' : '' }}</span>
                  <span class="home-stats__name">{{ 'repository.home.stats.courses' | translate }}</span>
                </a>
              </li>
            }
            @if (stats.people) {
              <li>
                <a class="home-stats__item" [routerLink]="['/search']" [queryParams]="peopleParams">
                  <span class="home-stats__value">{{ stats.people | number }}</span>
                  <span class="home-stats__name">{{ 'repository.home.stats.people' | translate }}</span>
                </a>
              </li>
            }
            @if (stats.firstYear) {
              <li>
                <span class="home-stats__item">
                  <span class="home-stats__value">{{ stats.firstYear }}</span>
                  <span class="home-stats__name">{{ 'repository.home.stats.first-year' | translate }}</span>
                </span>
              </li>
            }
          </ul>
          @if (stats.recentYears.length > 1) {
            <figure class="home-stats__trend">
              <div class="home-stats__spark" aria-hidden="true">
                @for (bar of stats.recentYears; track bar.year) {
                  <span [style.--bar]="bar.percent + '%'"></span>
                }
              </div>
              <figcaption>{{ 'repository.home.stats.by-year' | translate: { first: stats.recentYears[0].year, last: stats.recentYears[stats.recentYears.length - 1].year } }}</figcaption>
            </figure>
          }
        </section>
      }
    }
  `,
  imports: [
    AsyncPipe,
    DecimalPipe,
    RouterLink,
    TranslateModule,
  ],
})
export class HomeStatsComponent {
  private static readonly COURSE_PAGE = 100;
  private readonly overview = inject(HomeOverviewService);

  readonly worksParams = { configuration: WORKS_SEARCH_CONFIGURATION };
  readonly peopleParams = { configuration: 'person' };

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
      recentYears: yearSeries(years),
    })),
  );
}
