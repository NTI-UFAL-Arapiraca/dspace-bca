import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PdfRangeCache } from '../../frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-range-cache.ts';

const bytes = (...values) => Uint8Array.from(values).buffer;
const content = parts => parts.flatMap(part => part.bytes ? [...part.bytes] : ['missing']);

test('keeps the completed ranges of PDF A and B independently across repeated switches', () => {
  const cache = new PdfRangeCache(20);
  cache.store('A', 0, bytes(1, 2, 3, 4));
  cache.store('B', 0, bytes(9, 8, 7, 6));
  for (let n = 0; n < 5; n++) {
    assert.deepEqual(content(cache.plan('A', 0, 4)), [1, 2, 3, 4]);
    assert.deepEqual(content(cache.plan('B', 0, 4)), [9, 8, 7, 6]);
  }
});

test('reuses overlapping and adjacent ranges and identifies only the missing gaps', () => {
  const cache = new PdfRangeCache();
  cache.store('A', 3, bytes(3, 4, 5));
  cache.store('A', 5, bytes(5, 6, 7));
  cache.store('A', 10, bytes(10, 11));
  const parts = cache.plan('A', 1, 13);
  assert.deepEqual(parts.filter(part => !part.bytes), [
    { begin: 1, end: 3 }, { begin: 8, end: 10 }, { begin: 12, end: 13 },
  ]);
  assert.deepEqual(content(cache.plan('A', 4, 8)), [4, 5, 6, 7]);
});

test('evicts the least recently used bytes at the shared memory limit', () => {
  const cache = new PdfRangeCache(8);
  cache.store('A', 0, bytes(1, 2, 3, 4));
  cache.store('B', 0, bytes(5, 6, 7, 8));
  cache.plan('A', 0, 4);
  cache.store('C', 0, bytes(9, 10, 11, 12));
  assert.deepEqual(content(cache.plan('B', 0, 4)), ['missing']);
  assert.deepEqual(content(cache.plan('A', 0, 4)), [1, 2, 3, 4]);
  assert.deepEqual(content(cache.plan('C', 0, 4)), [9, 10, 11, 12]);
});

test('owns stored bytes and keeps a longer cached interval when a shorter response arrives', () => {
  const cache = new PdfRangeCache();
  const response = bytes(1, 2, 3, 4);
  cache.store('A', 0, response);
  new Uint8Array(response).fill(0);
  cache.store('A', 0, bytes(1, 2));
  assert.deepEqual(content(cache.plan('A', 0, 4)), [1, 2, 3, 4]);
});

test('does not retain oversized responses and releases all data on clear', () => {
  const cache = new PdfRangeCache(4);
  cache.store('A', 0, bytes(1, 2, 3, 4, 5));
  assert.deepEqual(content(cache.plan('A', 0, 5)), ['missing']);
  cache.store('B', 0, bytes(1, 2, 3));
  cache.clear();
  assert.deepEqual(content(cache.plan('B', 0, 3)), ['missing']);
});
