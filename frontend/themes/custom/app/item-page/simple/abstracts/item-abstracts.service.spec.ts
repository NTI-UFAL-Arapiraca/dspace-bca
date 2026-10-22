import { TestBed } from '@angular/core/testing';
import { DspaceRestService } from '@dspace/core/dspace-rest/dspace-rest.service';
import { Item } from '@dspace/core/shared/item.model';
import {
  lastValueFrom,
  of,
  throwError,
} from 'rxjs';

import { ItemAbstractsService } from './item-abstracts.service';

describe('ItemAbstractsService', () => {
  let service: ItemAbstractsService;
  let rest: jasmine.SpyObj<DspaceRestService>;
  let item: Item;

  beforeEach(() => {
    rest = jasmine.createSpyObj<DspaceRestService>('DspaceRestService', ['get']);
    TestBed.configureTestingModule({ providers: [{ provide: DspaceRestService, useValue: rest }] });
    service = TestBed.inject(ItemAbstractsService);
    item = Object.assign(new Item(), {
      _links: { self: { href: 'https://repository.example/server/api/core/items/work?existing=1' } },
      metadata: { 'dc.description.abstract': [{ language: 'pt', value: 'Resumo' }] },
    });
  });

  it('requests all languages and preserves existing parameters without replacing localized metadata', async () => {
    const multilingual = { metadata: {
      'dc.description.abstract': [
        { language: 'pt', value: 'Resumo' }, { language: 'en', value: 'Abstract' }, { language: 'es', value: 'Resumen' },
      ],
      'dc.title': [{ language: 'en', value: 'Another title' }],
    } };
    rest.get.and.returnValue(of({ payload: multilingual, statusCode: 200, statusText: 'OK' }));

    const state = await lastValueFrom(service.load(item));
    expect(rest.get).toHaveBeenCalledWith(
      'https://repository.example/server/api/core/items/work?existing=1&projection=allLanguages',
    );
    expect(state.values.length).toBe(3);
    expect(state.failed).toBeFalse();
    expect(item.allMetadata(['dc.description.abstract']).length).toBe(1);
    expect(item.hasMetadata('dc.title')).toBeFalse();
  });

  it('keeps the available summary and reports a failure instead of implying all languages loaded', async () => {
    rest.get.and.returnValue(throwError(() => new Error('Unavailable')));
    const state = await lastValueFrom(service.load(item));
    expect(state.failed).toBeTrue();
    expect(state.loading).toBeFalse();
    expect(state.values.map(({ value }) => value)).toEqual(['Resumo']);
  });

  it('handles an absent item without requesting the API', async () => {
    expect((await lastValueFrom(service.load(undefined))).values).toEqual([]);
    expect(rest.get).not.toHaveBeenCalled();
  });
});
