import {
  inject,
  Injectable,
} from '@angular/core';
import { DspaceRestService } from '@dspace/core/dspace-rest/dspace-rest.service';
import { Item } from '@dspace/core/shared/item.model';
import {
  catchError,
  map,
  Observable,
  of,
  startWith,
} from 'rxjs';

import { AbstractValue } from './abstract-language';

export interface ItemAbstractsState {
  values: AbstractValue[];
  loading: boolean;
  failed: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemAbstractsService {
  private readonly rest = inject(DspaceRestService);

  load(item: Item): Observable<ItemAbstractsState> {
    const values = item?.allMetadata(['dc.description.abstract']) ?? [];
    const href = item?._links?.self?.href;
    if (!href) {
      return of({ values, loading: false, failed: false });
    }

    const url = new URL(href);
    url.searchParams.set('projection', 'allLanguages');
    // Use the official REST client (including auth/locale interceptors), without
    // replacing the localized item in the shared DSO object cache.
    return this.rest.get(url.toString()).pipe(
      map((response) => ({
        values: (response.payload?.metadata?.['dc.description.abstract'] ?? []) as AbstractValue[],
        loading: false,
        failed: false,
      })),
      catchError(() => of({ values, loading: false, failed: true })),
      startWith({ values, loading: true, failed: false }),
    );
  }
}
