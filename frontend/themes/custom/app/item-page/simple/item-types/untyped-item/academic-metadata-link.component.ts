import {
  Component,
  Input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';

import {
  WorkFilter,
  workFilterParams,
} from '../../work/work-context';

/** Work fields shown as links to the works search filtered by their value. */
const FIELD_FILTERS = {
  'local.course.name': 'course',
  'local.campus.name': 'campus',
  'local.cnpq.area': 'cnpq',
} as const satisfies Record<string, WorkFilter>;

export type AcademicLinkField = keyof typeof FIELD_FILTERS;

@Component({
  selector: 'ds-academic-metadata-link',
  template: `
    @if (values.length) {
      <div class="simple-view-element">
        <h2 class="h5 item-page-label">{{ label | translate }}</h2>
        <ul class="list-unstyled mb-0">
          @for (metadataValue of values; track $index) {
            <li>
              <a [routerLink]="['/search']" [queryParams]="filterParams(metadataValue.value)"
                [attr.title]="'item.page.academic-filter-link' | translate">
                {{ metadataValue.value }} <i class="fas fa-link ms-1" aria-hidden="true"></i>
              </a>
            </li>
          }
        </ul>
      </div>
    }
  `,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class AcademicMetadataLinkComponent {
  @Input() item: Item;
  @Input() field: AcademicLinkField;
  @Input() label: string;

  get values() {
    return this.item?.metadata?.[this.field] ?? [];
  }

  filterParams(value: string): Record<string, string> {
    return workFilterParams(FIELD_FILTERS[this.field], value);
  }
}
