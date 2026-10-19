import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { SearchService } from '../../../../app/shared/search/search.service';

/** Keep the mobile header controls stationary while searching the repository. */
@Component({
  selector: 'ds-mobile-search',
  templateUrl: './mobile-search.component.html',
  imports: [FormsModule, TranslateModule],
})
export class MobileSearchComponent {
  private readonly modals = inject(NgbModal);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private dialog?: NgbModalRef;

  constructor() {
    // A resize to the desktop header must not leave a detached modal open.
    inject(DestroyRef).onDestroy(() => this.dialog?.dismiss());
  }

  open(content: TemplateRef<unknown>): void {
    this.dialog = this.modals.open(content, {
      ariaLabelledBy: 'mobile-search-title',
      windowClass: 'mobile-search-modal',
    });
  }

  search(query: string): void {
    this.dialog?.close();
    // Header search is global: do not merge filters from the current page.
    void this.router.navigate([this.searchService.getSearchLink()], {
      queryParams: { query: query || '' },
    });
  }
}
