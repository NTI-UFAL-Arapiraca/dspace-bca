import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { HostWindowService } from '../../../../../../app/shared/host-window.service';
import { StartsWithDateComponent as BaseComponent } from '../../../../../../app/shared/starts-with/date/starts-with-date.component';
import { renderStartsWithFor } from '../../../../../../app/shared/starts-with/starts-with-decorator';
import { StartsWithType } from '../../../../../../app/shared/starts-with/starts-with-type';

@Component({
  selector: 'ds-starts-with-date',
  templateUrl: './starts-with-date.component.html',
  styleUrls: ['../../../../../../app/shared/starts-with/date/starts-with-date.component.scss'],
  imports: [AsyncPipe, FormsModule, ReactiveFormsModule, TranslateModule],
})
@renderStartsWithFor(StartsWithType.date)
export class StartsWithDateComponent extends BaseComponent {
  readonly compactLabels$ = inject(HostWindowService).isXs();
}
