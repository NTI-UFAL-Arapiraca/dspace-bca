import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import { Context } from '@dspace/core/shared/context.model';
import { Item } from '@dspace/core/shared/item.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';

import { UntypedItemComponent as BaseComponent } from '../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ACADEMIC_ITEM_IMPORTS } from '../../work/academic-item-imports';

@listableObjectComponent(Item, ViewMode.StandalonePage, Context.Any, 'custom')
@Component({
  selector: 'ds-untyped-item',
  styleUrls: [
    '../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component.scss',
    './untyped-item.component.scss',
  ],
  templateUrl: './untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: ACADEMIC_ITEM_IMPORTS,
})
export class UntypedItemComponent extends BaseComponent {
  readonly isAdmin$ = inject(AuthorizationDataService).isAuthorized(FeatureID.AdministratorOf);
}
