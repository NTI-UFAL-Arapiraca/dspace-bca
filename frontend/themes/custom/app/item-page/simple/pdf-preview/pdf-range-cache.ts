export const PDF_RANGE_CACHE_BYTES = 64 * 1024 * 1024;

export interface PdfRangePart {
  begin: number;
  end: number;
  bytes?: Uint8Array;
}

interface CachedRange {
  document: string;
  begin: number;
  bytes: Uint8Array;
}

/** Completed byte ranges only; insertion order tracks least recently used data. */
export class PdfRangeCache {
  private readonly ranges = new Map<string, CachedRange>();
  private readonly limit: number;
  private size = 0;

  constructor(limit = PDF_RANGE_CACHE_BYTES) {
    this.limit = limit;
  }

  /** Partition a request into reusable bytes and gaps, without fetching extra data. */
  plan(document: string, begin: number, end: number): PdfRangePart[] {
    const matches = [...this.ranges.entries()].filter(([, range]) =>
      range.document === document && range.begin < end && range.begin + range.bytes.byteLength > begin,
    ).sort(([, a], [, b]) => a.begin - b.begin);
    const parts: PdfRangePart[] = [];
    let position = begin;
    for (const [key, range] of matches) {
      const rangeEnd = Math.min(end, range.begin + range.bytes.byteLength);
      if (rangeEnd <= position) {
        continue;
      }
      if (range.begin > position) {
        parts.push({ begin: position, end: range.begin });
        position = range.begin;
      }
      parts.push({ begin: position, end: rangeEnd, bytes: range.bytes.subarray(position - range.begin, rangeEnd - range.begin) });
      position = rangeEnd;
      this.ranges.delete(key);
      this.ranges.set(key, range);
      if (position === end) {
        break;
      }
    }
    if (position < end) {
      parts.push({ begin: position, end });
    }
    return parts;
  }

  store(document: string, begin: number, buffer: ArrayBuffer): void {
    if (buffer.byteLength === 0 || buffer.byteLength > this.limit) {
      return;
    }
    const key = JSON.stringify([document, begin]);
    const previous = this.ranges.get(key);
    if (previous && previous.bytes.byteLength >= buffer.byteLength) {
      this.ranges.delete(key);
      this.ranges.set(key, previous);
      return;
    }
    if (previous) {
      this.size -= previous.bytes.byteLength;
      this.ranges.delete(key);
    }
    // Own the bytes: buffers handed to a PDF worker may be detached or modified.
    const range = { document, begin, bytes: new Uint8Array(buffer).slice() };
    this.ranges.set(key, range);
    this.size += range.bytes.byteLength;
    while (this.size > this.limit) {
      const oldest = this.ranges.keys().next().value;
      this.size -= this.ranges.get(oldest).bytes.byteLength;
      this.ranges.delete(oldest);
    }
  }

  clear(): void {
    this.ranges.clear();
    this.size = 0;
  }
}
