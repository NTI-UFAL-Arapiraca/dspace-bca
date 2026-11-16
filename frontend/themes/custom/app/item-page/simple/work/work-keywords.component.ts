import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';

import { workFilterParams } from './work-context';

/** Keywords (dc.subject) as links to the works search filtered by subject. */
@Component({
  selector: 'ds-work-keywords',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (keywords().length) {
      <section class="work-keywords" aria-labelledby="work-keywords-title">
        <h2 id="work-keywords-title" class="ufal-label">{{ 'item.page.subject' | translate }}</h2>
        <ul class="work-keywords__list">
          @for (keyword of keywords(); track keyword) {
            <li><a class="ufal-chip" [routerLink]="['/search']" [queryParams]="params('subject', keyword)">{{ keyword }}</a></li>
          }
        </ul>
      </section>
    }
  `,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class WorkKeywordsComponent {
  readonly item = input.required<Item>();
  readonly keywords = computed(() => [...new Set(
    (this.item()?.metadata?.['dc.subject'] ?? []).map((value) => value?.value?.trim()).filter((value) => !!value),
  )]);
  readonly params = workFilterParams;
}
