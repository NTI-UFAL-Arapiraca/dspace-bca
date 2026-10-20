import { AsyncPipe } from '@angular/common';
import { afterNextRender, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import { Context } from '@dspace/core/shared/context.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';
import { GenericItemPageFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { TabbedRelatedEntitiesSearchComponent } from 'src/app/item-page/simple/related-entities/tabbed-related-entities-search/tabbed-related-entities-search.component';
import { RelatedItemsComponent } from 'src/app/item-page/simple/related-items/related-items-component';
import { DsoEditMenuComponent } from 'src/app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from 'src/app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { ThemedResultsBackButtonComponent } from 'src/app/shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from 'src/app/thumbnail/themed-thumbnail.component';

import { PersonComponent as BaseComponent } from '../../../../../../../app/entity-groups/research-entities/item-pages/person/person.component';
import { ItemPageOrcidFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/orcid/item-page-orcid-field.component';
import { AuthorityRelatedEntitiesSearchComponent } from '../../../../../../../app/item-page/simple/related-entities/authority-related-entities-search/authority-related-entities-search.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { PersonSearchNavigationService } from '../../../../../../../app/person-search-navigation.service';
import { PersonActivityComponent } from './person-activity.component';
import { degreeTranslation, lattesUrl } from './person-profile.helpers';

@listableObjectComponent('Person', ViewMode.StandalonePage, Context.Any, 'custom')
@Component({
  selector: 'ds-person',
  styleUrls: ['./person-profile.scss'],
  templateUrl: './person.component.html',
  imports: [
    AsyncPipe, AuthorityRelatedEntitiesSearchComponent, DsoEditMenuComponent,
    GenericItemPageFieldComponent, ItemPageOrcidFieldComponent, MetadataFieldWrapperComponent,
    PersonActivityComponent, RelatedItemsComponent, RouterLink, TabbedRelatedEntitiesSearchComponent,
    ThemedResultsBackButtonComponent, ThemedThumbnailComponent, TranslateModule,
  ],
})
export class PersonComponent extends BaseComponent {
  private readonly searchNavigation = inject(PersonSearchNavigationService);
  readonly isAdmin$ = inject(AuthorizationDataService).isAuthorized(FeatureID.AdministratorOf);
  // The theme loads this component asynchronously, after the initial router Scroll.
  private readonly initialAnchor = afterNextRender(() => {
    if (this.router.parseUrl(this.router.url).fragment === 'person-works') {
      this.searchNavigation.scrollToWorks('instant', true);
    }
  });

  readonly configurations = ['works', 'authored', 'advised', 'coadvised', 'reviewed'].map(role => `RELATION.Person.${role}`);
  readonly degreeTranslation = degreeTranslation;
  readonly lattesUrl = lattesUrl;

  get displayName(): string {
    return [this.object?.firstMetadataValue('person.givenName'), this.object?.firstMetadataValue('person.familyName')]
      .filter(Boolean).join(' ') || this.object?.name;
  }

  values(field: string): string[] {
    return this.object?.allMetadataValues(field) ?? [];
  }
}
