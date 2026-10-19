import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SearchConfigurationService } from '../../../../app/shared/search/search-configuration.service';

@Injectable()
export class RepositorySearchConfigurationService extends SearchConfigurationService {
  override getCurrentScope(): Observable<string> {
    // On the repository search page, removing scope always means all collections.
    // The base service can reuse the initial URL's scope as its pagination default.
    return this.routeService.getQueryParameterValue('scope').pipe(map((scope) => scope || ''));
  }
}
