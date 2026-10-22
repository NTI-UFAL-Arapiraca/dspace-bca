import assert from 'node:assert/strict';
import { test } from 'node:test';

import { splitPdfFilename } from '../../frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-filename.ts';

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
