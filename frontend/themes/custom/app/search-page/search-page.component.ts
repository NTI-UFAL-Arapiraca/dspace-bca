import { Component } from '@angular/core';

import { SEARCH_CONFIG_SERVICE } from '../../../../app/my-dspace-page/my-dspace-configuration.service';
import { SearchPageComponent as BaseComponent } from '../../../../app/search-page/search-page.component';
import { ThemedSearchComponent } from '../../../../app/shared/search/themed-search.component';
import { RepositorySearchConfigurationService } from './repository-search-configuration.service';

@Component({
  selector: 'ds-themed-search-page',
  templateUrl: '../../../../app/search-page/search-page.component.html',
  providers: [{ provide: SEARCH_CONFIG_SERVICE, useClass: RepositorySearchConfigurationService }],
  imports: [ThemedSearchComponent],
})
export class SearchPageComponent extends BaseComponent {
}
