import assert from 'node:assert/strict';
import { test } from 'node:test';

import { personInitials } from '../../frontend/themes/custom/app/entity-groups/research-entities/item-pages/person/person-profile.helpers.ts';
import { isSearchShortcut } from '../../frontend/themes/custom/app/header/search-shortcut.ts';
import { yearSearchParams, yearSeries } from '../../frontend/themes/custom/app/home-page/overview/year-series.ts';
import { documentLanguageName } from '../../frontend/themes/custom/app/item-page/simple/work/document-language.ts';
import { isPdfName, permanentLink } from '../../frontend/themes/custom/app/item-page/simple/work/work-access-state.ts';
import { workContext, workFilterParams } from '../../frontend/themes/custom/app/item-page/simple/work/work-context.ts';

const key = (overrides = {}) => ({ key: '/', ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, target: { tagName: 'BODY' }, ...overrides });

test('"/" focuses search only outside editable controls and without modifiers', () => {
  assert.equal(isSearchShortcut(key()), true);
  assert.equal(isSearchShortcut(key({ target: null })), true);
  for (const tagName of ['INPUT', 'textarea', 'SELECT']) {
    assert.equal(isSearchShortcut(key({ target: { tagName } })), false);
  }
  assert.equal(isSearchShortcut(key({ target: { tagName: 'DIV', isContentEditable: true } })), false);
  assert.equal(isSearchShortcut(key({ ctrlKey: true })), false);
  assert.equal(isSearchShortcut(key({ key: 'a' })), false);
  assert.equal(isSearchShortcut(key({ defaultPrevented: true })), false);
});

test('work context reads type, course, campus and the year of dc.date.issued only', () => {
  const metadata = {
    'dc.type': [{ value: 'Trabalho de conclusão de curso' }],
    'local.course.name': [{ value: ' Enfermagem ' }, { value: '' }],
    'local.campus.name': [{ value: 'Campus Arapiraca' }],
    'dc.date.issued': [{ value: '2025-03-14' }],
    'local.date.defense': [{ value: '2024-12-12' }],
  };
  assert.deepEqual(workContext(metadata), {
    types: ['Trabalho de conclusão de curso'],
    courses: ['Enfermagem'],
    campuses: ['Campus Arapiraca'],
    year: '2025',
  });
  assert.deepEqual(workContext(undefined), { types: [], courses: [], campuses: [], year: undefined });
  assert.equal(workContext({ 'dc.date.issued': [{ value: 's.d.' }] }).year, undefined);
});

test('filters link to the public works search with an exact value', () => {
  assert.deepEqual(workFilterParams('course', 'Letras'), {
    configuration: 'academic_works_search',
    'f.course': 'Letras,equals',
  });
});

test('year series groups by year, fills gaps and keeps the most recent years', () => {
  const series = yearSeries([
    { label: '2019', count: 4 },
    { label: '2019-05-10', count: 1 },
    { label: '2021', count: 10 },
    { label: 's.d.', count: 7 },
    { label: '2020', count: 0 },
  ]);
  assert.deepEqual(series.map(({ year, count }) => [year, count]), [[2019, 5], [2020, 0], [2021, 10]]);
  assert.deepEqual(series.map((bar) => bar.percent), [50, 0, 100]);
  assert.deepEqual(yearSeries([]), []);
  const long = yearSeries([{ label: '1990', count: 1 }, { label: '2025', count: 1 }], 10);
  assert.equal(long.length, 10);
  assert.equal(long[0].year, 2016);
  assert.deepEqual(yearSearchParams(2020), {
    configuration: 'academic_works_search', 'f.dateIssued.min': '2020', 'f.dateIssued.max': '2020',
  });
});

test('document language is named in the interface language, keeping unknown codes', () => {
  assert.equal(documentLanguageName('pt_BR', 'pt-BR'), 'Português (Brasil)');
  assert.equal(documentLanguageName('en', 'pt-BR'), 'Inglês');
  assert.equal(documentLanguageName('en', 'en'), 'English');
  assert.equal(documentLanguageName('other', 'pt-BR'), 'other');
  assert.equal(documentLanguageName('zz-invalid-tag-!!', 'pt-BR'), 'zz-invalid-tag-!!');
});

test('access helpers pick the PDF label and the permanent handle link', () => {
  assert.equal(isPdfName('tcc-final.PDF'), true);
  assert.equal(isPdfName('dados.csv'), false);
  assert.equal(isPdfName(undefined), false);
  assert.equal(permanentLink(['urn:x', 'https://example.org/handle/1/2'], 'https://page'), 'https://example.org/handle/1/2');
  assert.equal(permanentLink([], 'https://page'), 'https://page');
});

test('initials skip particles and use first and last names', () => {
  assert.equal(personInitials('Helena Ipê Menezes'), 'HM');
  assert.equal(personInitials('Marina Aurora de Lima'), 'ML');
  assert.equal(personInitials('Ana'), 'A');
  assert.equal(personInitials(''), '');
});
