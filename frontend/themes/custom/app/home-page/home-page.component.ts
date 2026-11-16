import {
  AsyncPipe,
  NgTemplateOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCoarComponent } from '../../../../app/home-page/home-coar/home-coar.component';
import { ThemedHomeNewsComponent } from '../../../../app/home-page/home-news/themed-home-news.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../../../../app/search-page/themed-configuration-search-page.component';
import { MarkdownViewerComponent } from '../../../../app/shared/markdown-viewer/markdown-viewer.component';
import { HomeExploreComponent } from './overview/home-explore.component';
import { HomeRecentRecordsComponent } from './recent-records/home-recent-records.component';

@Component({
  selector: 'ds-themed-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  imports: [
    AsyncPipe,
    HomeCoarComponent,
    HomeExploreComponent,
    HomeRecentRecordsComponent,
    MarkdownViewerComponent,
    NgTemplateOutlet,
    RouterLink,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    ThemedHomeNewsComponent,
    TranslateModule,
  ],
})
export class HomePageComponent extends BaseComponent {
}
