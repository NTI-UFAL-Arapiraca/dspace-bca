import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';

/**
 * Introduce the institutional collection at the existing home extension point.
 * Search, community loading and recent submissions remain owned by DSpace.
 */
@Component({
  selector: 'ds-themed-home-news',
  templateUrl: './home-news.component.html',
  styleUrls: ['./home-news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class HomeNewsComponent extends BaseComponent {
}
