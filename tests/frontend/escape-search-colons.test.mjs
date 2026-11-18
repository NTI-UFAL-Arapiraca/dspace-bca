import assert from 'node:assert/strict';
import { test } from 'node:test';

import { escapeSearchColons } from '../../frontend/overrides/escape-search-colons.ts';

test('escapes each unquoted colon in a repository search', () => {
  assert.equal(escapeSearchColons('Plano de negócios: roupas: um estudo'),
    String.raw`Plano de negócios\: roupas\: um estudo`);
});

test('preserves existing escapes, quoted phrases and other query syntax', () => {
  const query = String.raw`"estudo: um \"caso\"" AND negócios\: análise`;
  assert.equal(escapeSearchColons(query), query);
  assert.equal(escapeSearchColons(String.raw`tema\\: análise`), String.raw`tema\\\: análise`);
});
