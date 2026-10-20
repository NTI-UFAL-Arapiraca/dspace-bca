import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPdfPreviewGate, isValidPdfRange, PDF_AUTO_PREVIEW_LIMIT } from '../../frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-preview-policy.ts';

test('requires opt-in at the size limit, including browsers without network information', () => {
  assert.equal(getPdfPreviewGate(PDF_AUTO_PREVIEW_LIMIT - 1), undefined);
  assert.equal(getPdfPreviewGate(PDF_AUTO_PREVIEW_LIMIT), 'large');
});

test('requires opt-in for data saving or slow connection estimates even for a small PDF', () => {
  for (const connection of [
    { saveData: true }, { effectiveType: 'slow-2g' }, { effectiveType: '2g' },
    { effectiveType: '3g' }, { downlink: 0.5 },
  ]) {
    assert.equal(getPdfPreviewGate(1024, connection), 'limited');
  }
});

test('does not equate a cellular connection or unavailable speed estimate with a data cap', () => {
  for (const connection of [undefined, {}, { effectiveType: '4g' }, { downlink: 0 }, { type: 'cellular' }]) {
    assert.equal(getPdfPreviewGate(1024, connection), undefined);
  }
});

test('avoids automatic transfer when size is invalid or unknown', () => {
  for (const size of [undefined, null, NaN, Infinity, -1, 0, 1.5]) {
    assert.equal(getPdfPreviewGate(size), 'unknown-size');
  }
});

test('validates exclusive-end byte ranges', () => {
  assert.equal(isValidPdfRange(0, 1024, 1024), true);
  assert.equal(isValidPdfRange(1023, 1024, 1024), true);
  for (const [begin, end] of [[-1, 1], [0, 1025], [10, 10], [2, 1], [0.5, 10], [0, Infinity]]) {
    assert.equal(isValidPdfRange(begin, end, 1024), false);
  }
});
