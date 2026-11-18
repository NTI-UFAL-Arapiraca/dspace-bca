import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetadataValue } from '@dspace/core/shared/metadata.models';
import { Metadata } from '@dspace/core/shared/metadata.utils';
import { TranslateModule } from '@ngx-translate/core';

import { MetadataLinkViewComponent } from '../../../../../app/shared/metadata-link-view/metadata-link-view.component';

@Component({
  selector: 'ds-work-contributors',
  templateUrl: './work-contributors.component.html',
  styleUrls: ['./work-contributors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetadataLinkViewComponent, NgTemplateOutlet, RouterLink, TranslateModule],
})
export class WorkContributorsComponent {
  readonly authors = input.required<MetadataValue[]>();
  readonly advisors = input.required<MetadataValue[]>();

  protected isLinked(person: MetadataValue): boolean {
    return Metadata.hasValidItemAuthority(person.authority);
  }

  protected personSearchParams(name: string) {
    return { configuration: 'person', query: `"${name.trim().replace(/["\\]/g, '\\$&')}"` };
  }
}
