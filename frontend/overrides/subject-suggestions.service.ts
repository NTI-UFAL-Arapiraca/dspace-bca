import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@dspace/config/app-config.interface';
import { RESTURLCombiner } from '@dspace/core/url-combiner/rest-url-combiner';
import { catchError, map, Observable, of } from 'rxjs';

interface SubjectBrowseResponse {
  _embedded?: { entries?: { value: string }[] };
}

@Injectable({ providedIn: 'root' })
export class SubjectSuggestionsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = new RESTURLCombiner(
    inject(APP_CONFIG).rest.baseUrl, 'discover', 'browses', 'subject', 'entries',
  ).toString();

  findByPrefix(prefix: string): Observable<string[]> {
    return this.http.get<SubjectBrowseResponse>(this.endpoint, {
      params: { startsWith: prefix, size: 10 },
    }).pipe(
      map(response => [...new Set((response._embedded?.entries ?? []).map(entry => entry.value))]),
      catchError(() => of([])),
    );
  }
}
