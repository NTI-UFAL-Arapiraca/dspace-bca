import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import { ThemedSearchFormComponent } from '../../../../../app/shared/search-form/themed-search-form.component';
import { HomeStatsComponent } from '../overview/home-stats.component';

/**
 * Home opening (RFC 0026): what the repository holds, the search as the main
 * action and the collection in numbers. Uses the official extension point.
 */
@Component({
  selector: 'ds-themed-home-news',
  templateUrl: './home-news.component.html',
  styleUrls: ['./home-news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HomeStatsComponent,
    ThemedSearchFormComponent,
    TranslateModule,
  ],
})
export class HomeNewsComponent extends BaseComponent {
}
