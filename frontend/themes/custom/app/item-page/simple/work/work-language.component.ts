import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Item } from '@dspace/core/shared/item.model';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { map } from 'rxjs';

import { documentLanguageName } from './document-language';

/**
 * Language of the document itself (dc.language.iso). It is independent of the
 * languages of the abstracts, which carry their own qualifiers.
 */
@Component({
  selector: 'ds-work-language',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (names().length) {
      <div class="simple-view-element">
        <h2 class="simple-view-element-header">{{ 'item.page.document-language' | translate }}</h2>
        <div class="simple-view-element-body">{{ names().join(', ') }}</div>
      </div>
    }
  `,
  imports: [
    TranslateModule,
  ],
})
export class WorkLanguageComponent {
  readonly item = input.required<Item>();
  private readonly translate = inject(TranslateService);
  private readonly uiLanguage = toSignal(
    this.translate.onLangChange.pipe(map((event) => event.lang)),
    { initialValue: this.translate.getCurrentLang() || 'pt-BR' },
  );

  readonly names = computed(() => (this.item()?.allMetadataValues('dc.language.iso') ?? [])
    .map((code) => documentLanguageName(code, this.uiLanguage()))
    .filter((name) => !!name));
}
