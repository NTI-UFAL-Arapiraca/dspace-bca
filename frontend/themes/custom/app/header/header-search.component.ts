import {
  Component,
  ElementRef,
  HostListener,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SearchService } from '../../../../app/shared/search/search.service';
import { isSearchShortcut } from './search-shortcut';

/**
 * Always-visible repository search for wide headers. The "/" key moves focus
 * to the field, as in other catalog interfaces; typing in any form is never
 * intercepted.
 */
@Component({
  selector: 'ds-header-search',
  templateUrl: './header-search.component.html',
  imports: [
    FormsModule,
    TranslateModule,
  ],
})
export class HeaderSearchComponent {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('queryInput');

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (isSearchShortcut(event)) {
      event.preventDefault();
      this.input().nativeElement.focus();
    }
  }

  search(query: string): void {
    // Header search is global: do not merge filters from the current page.
    void this.router.navigate([this.searchService.getSearchLink()], {
      queryParams: { query: query || '' },
    });
  }
}
