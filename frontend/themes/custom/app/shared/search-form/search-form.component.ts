import { AsyncPipe } from '@angular/common';
import {
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  of,
} from 'rxjs';
import { map } from 'rxjs/operators';

import { SEARCH_CONFIG_SERVICE } from '../../../../../app/my-dspace-page/my-dspace-configuration.service';
import { SearchFormComponent as BaseComponent } from '../../../../../app/shared/search-form/search-form.component';
import { BrowserOnlyPipe } from '../../../../../app/shared/utils/browser-only.pipe';

@Component({
  selector: 'ds-themed-search-form',
  styleUrls: [
    '../../../../../app/shared/search-form/search-form.component.scss',
    './search-form.component.scss',
  ],
  templateUrl: './search-form.component.html',
  imports: [
    AsyncPipe,
    BrowserOnlyPipe,
    FormsModule,
    NgbTooltip,
    TranslateModule,
  ],
})
export class SearchFormComponent extends BaseComponent {
  private readonly contextConfig = inject(SEARCH_CONFIG_SERVICE, { optional: true });

  readonly contextFilters$ = this.contextConfig ? combineLatest([
    this.contextConfig.paginatedSearchOptions,
    this.searchService.appliedFilters$,
  ]).pipe(
    map(([options, filters]) => {
      if (!options.filters?.length && !options.fixedFilter) {
        return [];
      }
      return filters.length ? filters : null;
    }),
  ) : of([]);

  override ngOnChanges(): void {
    super.ngOnChanges();
    if (!this.scope) {
      this.selectedScope.next(undefined);
    }
  }
}
