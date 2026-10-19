import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Item } from '@dspace/core/shared/item.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-academic-metadata-link',
  template: `
    @if (values.length) {
      <div class="simple-view-element">
        <h5 class="item-page-label">{{ label | translate }}</h5>
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
  imports: [RouterLink, TranslateModule],
})
export class AcademicMetadataLinkComponent {
  @Input() item: Item;
  @Input() field: 'local.course.name' | 'local.campus.name';
  @Input() label: string;

  get values() {
    return this.item?.metadata?.[this.field] ?? [];
  }

  filterParams(value: string): Record<string, string> {
    const facet = this.field === 'local.course.name' ? 'course' : 'campus';
    return {
      configuration: 'academic_works_search',
      [`f.${facet}`]: `${value},equals`,
    };
  }
}
