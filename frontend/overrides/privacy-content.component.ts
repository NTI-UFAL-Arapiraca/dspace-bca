import { Component } from '@angular/core';

/**
 * Displays the UFAL privacy notice. Replaces the official component so its
 * imports match the static template in privacy-content.component.html, which
 * uses neither router links nor translation keys.
 */
@Component({
  selector: 'ds-privacy-content',
  templateUrl: './privacy-content.component.html',
  styleUrls: ['./privacy-content.component.scss'],
})
export class PrivacyContentComponent {
}
