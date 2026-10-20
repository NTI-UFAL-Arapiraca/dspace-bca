import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildStatisticsDashboard } from '../../frontend/themes/custom/app/statistics-page/statistics-page/statistics-dashboard.helpers.ts';

const ITEM_ID = 'd15ed831-8731-49ae-971d-2da8e201f1a1';
const PERSON_ID = '7ee0bd3a-9a09-4570-9a2b-123456789abc';
const COLLECTION_ID = '17ff7c31-d290-44fd-b002-dab09b4a9f45';
const report = (reportType, points) => ({ reportType, points });

test('site ranks records including Person without a fabricated site total', () => {
  const data = buildStatisticsDashboard([
    report('TotalVisits', [
      { id: ITEM_ID, label: 'Trabalho', type: 'item', values: { views: 62 } },
      { id: PERSON_ID, label: 'Helena', type: 'item', values: { views: 4 } },
    ]),
  ], 'site', 'site-id');

  assert.equal(data.visits, null);
  assert.deepEqual(data.ranking.map((entry) => entry.label), ['Trabalho', 'Helena']);
  assert.deepEqual(data.ranking.map((entry) => entry.value), [62, 4]);
});

test('item keeps monthly zeros and sums only bitstream accesses', () => {
  const data = buildStatisticsDashboard([
    report('TotalVisits', [{ id: ITEM_ID, type: 'item', values: { views: 62 } }]),
    report('TotalVisitsPerMonth', [
      { id: '2026-09', label: 'September 2026', type: 'date', values: { views: 0 } },
      { id: '2026-10', label: 'October 2026', type: 'date', values: { views: 62 } },
    ]),
    report('TotalDownloads', [
      { id: 'file-a', type: 'bitstream', values: { views: 20 } },
      { id: 'other', type: 'item', values: { views: 999 } },
    ]),
    report('TopCountries', []),
  ], 'item', ITEM_ID);

  assert.equal(data.visits, 62);
  assert.equal(data.downloads, 20);
  assert.deepEqual(data.months.map((entry) => entry.value), [0, 62]);
  assert.equal(data.months[0].monthKey, 'repository.statistics.month.9');
  assert.deepEqual(data.countries, []);
});

test('file accesses prefer downloads when both backend metrics are present', () => {
  const data = buildStatisticsDashboard([
    report('TotalDownloads', [
      { id: 'file-a', type: 'bitstream', values: { downloads: 7, views: 20 } },
      { id: 'file-b', type: 'bitstream', values: { downloads: 3 } },
    ]),
  ], 'item', ITEM_ID);

  assert.equal(data.downloads, 10);
});

test('scoped zero is preserved, child points are not mistaken for a total', () => {
  const data = buildStatisticsDashboard([
    report('TotalVisits', [
      { id: COLLECTION_ID, type: 'collection', values: { views: 0 } },
      { id: ITEM_ID, label: 'Trabalho', type: 'item', values: { views: 62 } },
    ]),
  ], 'collection', COLLECTION_ID);
  assert.equal(data.visits, 0);
  assert.equal(data.ranking.length, 1);

  const noScopedPoint = buildStatisticsDashboard([
    report('TotalVisits', [{ id: ITEM_ID, type: 'item', values: { views: 62 } }]),
  ], 'community', COLLECTION_ID);
  assert.equal(noScopedPoint.visits, null);
});

test('unfamiliar reports remain inspectable as tables', () => {
  const data = buildStatisticsDashboard([
    report('FutureReport', [{ id: 'x', label: 'Example', type: 'other', values: { views: 3, future: 5 } }]),
  ], 'item', ITEM_ID);

  assert.equal(data.hasData, true);
  assert.equal(data.tables[0].title, 'FutureReport');
  assert.deepEqual(data.tables[0].headers, ['views', 'future']);
  assert.deepEqual(data.tables[0].rows[0].values, [3, 5]);
});
