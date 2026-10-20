import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PDF_VIEWER_PATH, selectPdfDocuments } from '../../frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-documents.ts';
import { configureViewer, assetVersion } from '../../frontend/patches/install-pdf-viewer.mjs';

const file = (id, mimetype = 'application/pdf') => ({ bitstream: { id }, mimetype });

test('selects the configured primary PDF before supplementary PDFs', () => {
  const files = [file('appendix'), file('main'), file('data', 'text/csv')];
  assert.deepEqual(selectPdfDocuments(files, 'main'), [
    { bitstream: { id: 'main' }, isPrimary: true },
    { bitstream: { id: 'appendix' }, isPrimary: false },
  ]);
  assert.deepEqual(files.map(({ bitstream }) => bitstream.id), ['appendix', 'main', 'data']);
});

test('preserves bundle order when no primary PDF is configured', () => {
  for (const primary of [undefined, 'missing', 'image']) {
    const result = selectPdfDocuments([file('b'), file('image', 'image/png'), file('a')], primary);
    assert.deepEqual(result.map(({ bitstream }) => bitstream.id), ['b', 'a']);
    assert.ok(result.every(({ isPrimary }) => !isPrimary));
  }
});

test('does not infer PDF content from a misleading filename', () => {
  assert.deepEqual(selectPdfDocuments([
    file('looks-like.pdf', 'text/html'), { ...file('unknown.pdf'), mimetype: undefined }, file('image', 'image/jpeg'),
  ]), []);
});

test('handles an empty bundle and a single PDF', () => {
  assert.deepEqual(selectPdfDocuments([]), []);
  assert.deepEqual(selectPdfDocuments([file('only')]), [{ bitstream: { id: 'only' }, isPrimary: false }]);
});

test('configures the local viewer before startup without enabling PDF scripts or editing', () => {
  const source = 'function webViewerLoad() {\n  PDFViewerApplication.run(config);\n}';
  const configured = configureViewer(source);
  for (const option of ['AppOptions.set("enableScripting", false)', 'AppOptions.set("annotationEditorMode", -1)',
    'AppOptions.set("disablePreferences", true)', 'AppOptions.set("defaultUrl", "")']) {
    assert.ok(configured.indexOf(option) < configured.indexOf('PDFViewerApplication.run(config)'));
  }
  assert.ok(configured.includes('new URLSearchParams(location.search).get("locale")'));
});

test('rejects an unexpected viewer startup when upgrading PDF.js', () => {
  assert.throws(() => configureViewer('PDFViewerApplication.run(other);'), /Unexpected PDF.js startup/);
});

test('uses a versioned viewer URL matching the installed distribution, including a deployment namespace', () => {
  assert.equal(PDF_VIEWER_PATH, `assets/pdfjs/${assetVersion}/web/viewer.html`);
  assert.equal(new URL(PDF_VIEWER_PATH, 'https://repository.example/dspace/').pathname,
    `/dspace/assets/pdfjs/${assetVersion}/web/viewer.html`);
});
