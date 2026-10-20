/** Initial opt-in threshold, in bytes. Adjust here after measuring the collection. */
export const PDF_AUTO_PREVIEW_LIMIT = 20 * 1024 * 1024;

export interface PdfConnectionInfo {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
}

export type PdfPreviewGate = 'limited' | 'large' | 'unknown-size' | 'paused';

/** Connection information is optional; never infer a data cap from a mobile screen. */
export function getPdfPreviewGate(size: number, connection?: PdfConnectionInfo): PdfPreviewGate | undefined {
  if (!Number.isSafeInteger(size) || size <= 0) {
    return 'unknown-size';
  }
  if (connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)
    || (connection?.downlink > 0 && connection.downlink < 1)) {
    return 'limited';
  }
  return size >= PDF_AUTO_PREVIEW_LIMIT ? 'large' : undefined;
}

export function isValidPdfRange(begin: number, end: number, length: number): boolean {
  return Number.isSafeInteger(begin) && Number.isSafeInteger(end)
    && begin >= 0 && end > begin && end <= length;
}
