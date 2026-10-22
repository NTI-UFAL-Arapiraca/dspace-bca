import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MetadataFieldWrapperComponent } from '../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { MarkdownDirective } from '../../../../../../app/shared/utils/markdown.directive';
import { DisplayAbstract } from './abstract-language';

@Component({
  selector: 'ds-expandable-abstract',
  templateUrl: './expandable-abstract.component.html',
  styleUrls: ['./expandable-abstract.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MarkdownDirective,
    MetadataFieldWrapperComponent,
    TranslateModule,
  ],
})
export class ExpandableAbstractComponent implements OnChanges, OnDestroy {
  @Input() abstract: DisplayAbstract;
  @Input() contentId: string;
  @ViewChild('text', { static: true }) text: ElementRef<HTMLElement>;

  expanded = false;
  hasOverflow = false;

  private observer?: ResizeObserver;
  private readonly changeDetector = inject(ChangeDetectorRef);

  constructor() {
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        this.expanded = true;
        this.changeDetector.markForCheck();
        return;
      }
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this.text.nativeElement);
      this.measure();
    });
  }

  ngOnChanges(): void {
    this.expanded = false;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  private measure(): void {
    if (!this.expanded) {
      const element = this.text.nativeElement;
      this.hasOverflow = element.scrollHeight > element.clientHeight + 1;
      this.changeDetector.markForCheck();
    }
  }
}
