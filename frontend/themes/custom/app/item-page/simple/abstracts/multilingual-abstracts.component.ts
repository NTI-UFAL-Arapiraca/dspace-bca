import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { LocaleService } from '@dspace/core/locale/locale.service';
import { Item } from '@dspace/core/shared/item.model';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
} from 'rxjs';

import { displayAbstracts } from './abstract-language';
import { ExpandableAbstractComponent } from './expandable-abstract.component';
import { ItemAbstractsService } from './item-abstracts.service';

@Component({
  selector: 'ds-multilingual-abstracts',
  templateUrl: './multilingual-abstracts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ExpandableAbstractComponent,
    TranslateModule,
  ],
})
export class MultilingualAbstractsComponent {
  private readonly items = new BehaviorSubject<Item | undefined>(undefined);
  private readonly reload = new BehaviorSubject(0);
  private readonly abstracts = inject(ItemAbstractsService);
  private readonly translations = inject(TranslateService);
  private readonly locale = inject(LocaleService).getCurrentLanguageCode();

  @Input() set item(item: Item | undefined) {
    this.items.next(item);
  }

  readonly state$ = combineLatest([
    this.items.pipe(distinctUntilChanged((a, b) => a?.id === b?.id)),
    this.reload,
  ]).pipe(
    switchMap(([item]) => combineLatest([
      this.abstracts.load(item),
      this.locale,
    ]).pipe(map(([state, locale]) => ({
      ...state,
      itemId: item?.id ?? 'item',
      abstracts: displayAbstracts(state.values, locale, this.translations.instant('repository.item.abstract.summary')),
    })))),
  );

  retry(): void {
    this.reload.next(this.reload.value + 1);
  }
}
