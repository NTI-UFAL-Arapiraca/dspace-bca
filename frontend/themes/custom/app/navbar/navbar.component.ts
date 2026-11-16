import {
  AsyncPipe,
  NgClass,
  NgComponentOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ThemedUserMenuComponent } from 'src/app/shared/auth-nav-menu/user-menu/themed-user-menu.component';

import { NavbarComponent as BaseComponent } from '../../../../app/navbar/navbar.component';
import { slideMobileNav } from '../../../../app/shared/animations/slide';
import { PRIMARY_NAV_LINKS } from './primary-nav-links';

/**
 * Public navbar with task-oriented entries ("Trabalhos", "Pessoas") before the
 * menu sections provided by DSpace (communities, browse, statistics).
 */
@Component({
  selector: 'ds-themed-navbar',
  styleUrls: ['../../../../app/navbar/navbar.component.scss'],
  templateUrl: './navbar.component.html',
  animations: [slideMobileNav],
  imports: [
    AsyncPipe,
    NgbDropdownModule,
    NgClass,
    NgComponentOutlet,
    RouterLink,
    ThemedUserMenuComponent,
    TranslateModule,
  ],
})
export class NavbarComponent extends BaseComponent {
  readonly primaryLinks = PRIMARY_NAV_LINKS;
}
