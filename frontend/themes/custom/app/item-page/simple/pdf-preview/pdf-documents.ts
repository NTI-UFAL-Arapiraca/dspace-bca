import type { Bitstream } from '@dspace/core/shared/bitstream.model';

export const PDF_VIEWER_PATH = 'assets/pdfjs/6.4.299-range-1/web/viewer.html';

export interface FormattedBitstream {
  bitstream: Bitstream;
  mimetype: string;
}

export interface PdfDocument {
  bitstream: Bitstream;
  isPrimary: boolean;
}

/** Keep the bundle order, promoting only the configured primary PDF. */
export function selectPdfDocuments(files: FormattedBitstream[], primaryId?: string): PdfDocument[] {
  const documents = files
    .filter((file) => file.mimetype === 'application/pdf')
    .map(({ bitstream }) => ({ bitstream, isPrimary: bitstream.id === primaryId }));
  return documents.sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));
}
