/* eslint-disable dspace-angular-ts/themed-component-usages */
import { PersonComponent } from './app/entity-groups/research-entities/item-pages/person/person.component';
import { PublicationComponent } from './app/item-page/simple/item-types/publication/publication.component';
import { UntypedItemComponent } from './app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { ItemSearchResultListElementComponent } from './app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';

export const LISTABLE_COMPONENTS = [
  ItemSearchResultListElementComponent,
  PersonComponent,
  PublicationComponent,
  UntypedItemComponent,
];
