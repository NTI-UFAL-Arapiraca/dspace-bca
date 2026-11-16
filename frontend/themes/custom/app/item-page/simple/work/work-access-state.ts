import type { Bitstream } from '@dspace/core/shared/bitstream.model';

export interface WorkAccessState {
  /** Primary ORIGINAL file, or the first one when no primary is set. */
  file: Bitstream | null;
  canDownload: boolean;
  isPdf: boolean;
}

/** PDFs are recognized by name here only to pick the button label. */
export function isPdfName(name: string | undefined): boolean {
  return /\.pdf$/i.test(name ?? '');
}

/** Permanent link of a work: its handle URI, falling back to the page URL. */
export function permanentLink(uris: readonly string[], pageUrl: string): string {
  return uris.find((uri) => /^https?:\/\//i.test(uri)) ?? pageUrl;
}
