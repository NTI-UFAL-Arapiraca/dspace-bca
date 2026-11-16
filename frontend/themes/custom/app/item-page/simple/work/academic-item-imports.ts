import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CollectionsComponent } from '../../../../../../app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../../../../../app/item-page/simple/field-components/file-section/themed-file-section.component';
import { GenericItemPageFieldComponent } from '../../../../../../app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { GeospatialItemPageFieldComponent } from '../../../../../../app/item-page/simple/field-components/specific-field/geospatial/geospatial-item-page-field.component';
import { ItemPageLicenseFieldComponent } from '../../../../../../app/item-page/simple/field-components/specific-field/license/item-page-license-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from '../../../../../../app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { ThemedMetadataRepresentationListComponent } from '../../../../../../app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component';
import { AttachmentSectionComponent } from '../../../../../../app/shared/bitstream-attachment/section/attachment-section.component';
import { DsoEditMenuComponent } from '../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { ThemedResultsBackButtonComponent } from '../../../../../../app/shared/results-back-button/themed-results-back-button.component';
import { MultilingualAbstractsComponent } from '../abstracts/multilingual-abstracts.component';
import { AcademicMetadataLinkComponent } from '../item-types/untyped-item/academic-metadata-link.component';
import { LocalizedItemPageDateFieldComponent } from '../item-types/untyped-item/date/localized-item-page-date-field.component';
import { PdfPreviewComponent } from '../pdf-preview/pdf-preview.component';
import { WorkAccessComponent } from './work-access.component';
import { WorkContextComponent } from './work-context.component';
import { WorkKeywordsComponent } from './work-keywords.component';
import { WorkLanguageComponent } from './work-language.component';

/**
 * Standalone imports of the academic work template, shared by UntypedItem and
 * Publication so both pages always render the same structure.
 */
export const ACADEMIC_ITEM_IMPORTS = [
  AcademicMetadataLinkComponent,
  AsyncPipe,
  AttachmentSectionComponent,
  CollectionsComponent,
  DsoEditMenuComponent,
  GenericItemPageFieldComponent,
  GeospatialItemPageFieldComponent,
  ItemPageLicenseFieldComponent,
  ItemPageUriFieldComponent,
  LocalizedItemPageDateFieldComponent,
  MiradorViewerComponent,
  MultilingualAbstractsComponent,
  PdfPreviewComponent,
  RouterLink,
  ThemedFileSectionComponent,
  ThemedItemPageTitleFieldComponent,
  ThemedMediaViewerComponent,
  ThemedMetadataRepresentationListComponent,
  ThemedResultsBackButtonComponent,
  TranslateModule,
  WorkAccessComponent,
  WorkContextComponent,
  WorkKeywordsComponent,
  WorkLanguageComponent,
];
