import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import { Context } from '@dspace/core/shared/context.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';

import { PublicationComponent as BaseComponent } from '../../../../../../../app/item-page/simple/item-types/publication/publication.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ACADEMIC_ITEM_IMPORTS } from '../../work/academic-item-imports';

/** Publication entities reuse the academic work page of UntypedItem. */
@listableObjectComponent('Publication', ViewMode.StandalonePage, Context.Any, 'custom')
@Component({
  selector: 'ds-publication',
  styleUrls: [
    '../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component.scss',
    '../untyped-item/untyped-item.component.scss',
  ],
  templateUrl: '../untyped-item/untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: ACADEMIC_ITEM_IMPORTS,
})
export class PublicationComponent extends BaseComponent {
  readonly isAdmin$ = inject(AuthorizationDataService).isAuthorized(FeatureID.AdministratorOf);
}
