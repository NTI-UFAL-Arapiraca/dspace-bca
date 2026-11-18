import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Context } from '@dspace/core/shared/context.model';
import { ItemSearchResult } from '@dspace/core/shared/object-collection/item-search-result.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';

import { MetadataDirective } from '../../../../../../../../../app/shared/metadata.directive';
import { ThemedBadgesComponent } from '../../../../../../../../../app/shared/object-collection/shared/badges/themed-badges.component';
import { listableObjectComponent } from '../../../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ItemSearchResultListElementComponent as BaseComponent } from '../../../../../../../../../app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { workContext } from '../../../../../../item-page/simple/work/work-context';
import { WorkContributorsComponent } from '../../../../../work-contributors/work-contributors.component';

/**
 * A work in result lists (search, collections, profile tabs): type and year,
 * title, authorship with advisors, course, campus and access state.
 */
@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement, Context.Any, 'custom')
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement, Context.Any, 'custom')
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html',
  imports: [
    MetadataDirective,
    RouterLink,
    ThemedBadgesComponent,
    TranslateModule,
    WorkContributorsComponent,
  ],
})
export class ItemSearchResultListElementComponent extends BaseComponent {
  get work() {
    return workContext(this.dso?.metadata);
  }
}
