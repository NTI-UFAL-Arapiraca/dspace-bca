import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Context } from '@dspace/core/shared/context.model';
import { ItemSearchResult } from '@dspace/core/shared/object-collection/item-search-result.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';

import { MetadataDirective } from '../../../../../../../../../app/shared/metadata.directive';
import { MetadataLinkViewComponent } from '../../../../../../../../../app/shared/metadata-link-view/metadata-link-view.component';
import { ThemedBadgesComponent } from '../../../../../../../../../app/shared/object-collection/shared/badges/themed-badges.component';
import { listableObjectComponent } from '../../../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ItemSearchResultListElementComponent as BaseComponent } from '../../../../../../../../../app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { TruncatableComponent } from '../../../../../../../../../app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from '../../../../../../../../../app/shared/truncatable/truncatable-part/truncatable-part.component';
import { workContext } from '../../../../../../item-page/simple/work/work-context';

/**
 * A work in result lists (search, collections, profile tabs): type and year,
 * title, authorship with advisors, a short abstract excerpt with the query
 * highlighted by Discovery, then course and access state. No thumbnail: cover
 * pages of academic works are near-identical and cost a request each.
 */
@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement, Context.Any, 'custom')
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement, Context.Any, 'custom')
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html',
  imports: [
    MetadataDirective,
    MetadataLinkViewComponent,
    RouterLink,
    ThemedBadgesComponent,
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
  ],
})
export class ItemSearchResultListElementComponent extends BaseComponent {
  get work() {
    return workContext(this.dso?.metadata);
  }

  get advisors(): string {
    return (this.dso?.allMetadataValues('dc.contributor.advisor') ?? []).join('; ');
  }
}
