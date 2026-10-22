import assert from 'node:assert/strict';
import { test } from 'node:test';

import { abbreviatePdfFilename, splitPdfFilename } from '../../frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-filename.ts';

test('preserves the filename and its extension while exposing a bounded ending', () => {
  const name = 'Análise da capacidade e variabilidade do envase em uma indústria de Arapiraca-AL.PDF';
  const { start, end } = splitPdfFilename(name);
  assert.equal(start + end, name);
  assert.ok(end.endsWith('.PDF'));
  assert.ok(start.startsWith('Análise'));
  assert.ok(Array.from(end).length <= 16);
});

test('keeps short names, missing extensions and empty labels intact', () => {
  for (const name of ['', 'a', '.pdf', 'arquivo.pdf', 'Documento sem extensão']) {
    const parts = splitPdfFilename(name);
    assert.equal(parts.start + parts.end, name);
    if (name) assert.ok(parts.start.length > 0);
  }
});

test('does not split a Unicode character between the two visible parts', () => {
  const name = '📚'.repeat(25) + '.pdf';
  const { start, end } = splitPdfFilename(name);
  assert.equal(start + end, name);
  assert.ok(start.isWellFormed());
  assert.ok(end.isWellFormed());
});

test('bounds native option names to 48 characters with a middle ellipsis and preserved ending', () => {
  const name = 'Análise da capacidade e variabilidade do envase em uma indústria de Arapiraca-AL.PDF';
  const abbreviated = abbreviatePdfFilename(name);
  assert.equal(Array.from(abbreviated).length, 48);
  assert.equal(abbreviated, Array.from(name).slice(0, 24).join('') + '…' + Array.from(name).slice(-23).join(''));
  assert.ok(abbreviated.endsWith('Arapiraca-AL.PDF'));
});

test('keeps native option names intact up to the limit and truncates Unicode safely', () => {
  for (const name of ['', 'arquivo.pdf', 'a'.repeat(44) + '.pdf', 'Documento sem extensão']) {
    assert.equal(abbreviatePdfFilename(name), name);
  }
  const abbreviated = abbreviatePdfFilename('📚'.repeat(60) + '.pdf');
  assert.equal(Array.from(abbreviated).length, 48);
  assert.ok(abbreviated.isWellFormed());
  assert.ok(abbreviated.endsWith('.pdf'));
});
