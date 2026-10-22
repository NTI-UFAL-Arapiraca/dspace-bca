import assert from 'node:assert/strict';
import { test } from 'node:test';

import { displayAbstracts } from '../../frontend/themes/custom/app/item-page/simple/abstracts/abstract-language.ts';

test('shows every abstract with Portuguese first, English next and other languages in source order', () => {
  const values = [
    { language: 'fr', value: 'Français' },
    { language: 'en_US', value: 'English' },
    { language: 'pt_BR', value: 'Português' },
    { language: 'es', value: 'Español' },
    { language: 'pt', value: 'Outro resumo' },
  ];
  const original = structuredClone(values);
  assert.deepEqual(displayAbstracts(values), [
    { language: 'pt-BR', value: 'Português', title: 'Resumo' },
    { language: 'pt', value: 'Outro resumo', title: 'Resumo' },
    { language: 'en-US', value: 'English', title: 'Abstract' },
    { language: 'fr', value: 'Français', title: 'Résumé' },
    { language: 'es', value: 'Español', title: 'Resumen' },
  ]);
  assert.deepEqual(values, original);
});

test('uses the language name for other languages and preserves unknown qualifiers', () => {
  const titles = displayAbstracts([
    { language: 'ja', value: '日本語' },
    { language: 'invalid_language', value: 'Legacy text' },
    { language: 'zz', value: 'Unknown code' },
  ]).map(({ title }) => title);
  assert.deepEqual(titles, ['Resumo (Japonês)', 'Resumo (invalid-language)', 'Resumo (zz)']);
  assert.equal(displayAbstracts([{ language: 'ja', value: '日本語' }], 'en', 'Summary')[0].title, 'Summary (Japanese)');
});

test('accepts ISO aliases and regional tags without inferring a missing language', () => {
  const result = displayAbstracts([
    { language: 'eng', value: 'English' },
    { language: 'por', value: 'Português' },
    { language: null, value: 'No qualifier' },
    { language: 'und', value: 'Undetermined' },
  ]);
  assert.deepEqual(result.map(({ title }) => title), ['Resumo', 'Abstract', 'Resumo', 'Resumo']);
  assert.equal(result[2].language, null);
});

test('omits blank values and keeps complete Markdown and repeated values', () => {
  const text = '**Texto**\n\n' + 'Resumo longo. '.repeat(500);
  assert.deepEqual(displayAbstracts([
    { value: '  ', language: 'pt' },
    { value: text, language: 'pt' },
    { value: text, language: 'pt' },
  ]).map(({ value }) => value), [text, text]);
});
