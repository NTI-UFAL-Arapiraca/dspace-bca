import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  workFilterParams,
  WORKS_SEARCH_CONFIGURATION,
} from '../../item-page/simple/work/work-context';
import { HomeOverviewService } from './home-overview.service';

/**
 * Starting points under the home search: the most frequent keywords of the
 * works, read from the subject facet of the public works search. Nothing is
 * shown when the facet is empty or unavailable.
 */
@Component({
  selector: 'ds-home-suggestions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let subjects = subjects$ | async;
    @if (subjects?.length) {
      <div class="home-suggestions">
        <span class="home-suggestions__label" id="home-suggestions-label">{{ 'repository.home.suggestions' | translate }}</span>
        <ul class="home-suggestions__list" aria-labelledby="home-suggestions-label">
          @for (subject of subjects; track subject.value) {
            <li><a class="ufal-chip" [routerLink]="['/search']" [queryParams]="params('subject', subject.value)" [attr.title]="subject.label">{{ subject.label }}</a></li>
          }
        </ul>
      </div>
    }
  `,
  imports: [
    AsyncPipe,
    RouterLink,
    TranslateModule,
  ],
})
export class HomeSuggestionsComponent {
  private static readonly SIZE = 5;

  readonly subjects$ = inject(HomeOverviewService)
    .facet('subject', HomeSuggestionsComponent.SIZE, undefined, WORKS_SEARCH_CONFIGURATION);

  readonly params = workFilterParams;
}
