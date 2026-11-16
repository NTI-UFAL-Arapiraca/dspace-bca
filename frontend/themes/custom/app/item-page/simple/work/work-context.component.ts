import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';

import {
  workContext,
  workFilterParams,
} from './work-context';

/** Type, course, campus and year above the title of a work. */
@Component({
  selector: 'ds-work-context',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let ctx = context();
    @if (ctx.types.length || ctx.courses.length || ctx.campuses.length || ctx.year) {
      <p class="work-context">
        @for (type of ctx.types; track type) {
          <span class="work-context__type">{{ type }}</span>
        }
        @for (course of ctx.courses; track course) {
          <a class="work-context__item" [routerLink]="['/search']" [queryParams]="params('course', course)"
            [attr.title]="'item.page.academic-filter-link' | translate">{{ course }}</a>
        }
        @for (campus of ctx.campuses; track campus) {
          <a class="work-context__item" [routerLink]="['/search']" [queryParams]="params('campus', campus)"
            [attr.title]="'item.page.academic-filter-link' | translate">{{ campus }}</a>
        }
        @if (ctx.year) {
          <span class="work-context__item">
            <span class="visually-hidden">{{ 'item.page.publication-year' | translate }}: </span>{{ ctx.year }}
          </span>
        }
      </p>
    }
  `,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class WorkContextComponent {
  readonly item = input.required<Item>();
  readonly context = computed(() => workContext(this.item()?.metadata));
  readonly params = workFilterParams;
}
