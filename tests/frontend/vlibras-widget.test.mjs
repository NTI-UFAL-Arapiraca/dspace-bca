import assert from 'node:assert/strict';
import { test } from 'node:test';

import { initializeVLibras, VLIBRAS_SCRIPT_ID, VLIBRAS_SCRIPT_URL } from '../../frontend/themes/custom/app/accessibility/vlibras-widget.ts';

function browserDocument(baseURI = 'https://repository.example/dspace/') {
  const scripts = [];
  const document = {
    baseURI,
    getElementById: (id) => scripts.find((script) => script.id === id),
    createElement: (tag) => {
      assert.equal(tag, 'script');
      return Object.assign(new EventTarget(), {
        remove() { scripts.splice(scripts.indexOf(this), 1); },
      });
    },
    body: { appendChild: (script) => scripts.push(script) },
  };
  return { document, scripts, window: {} };
}

function officialAPI(window, calls) {
  window.VLibras = {
    Widget: class {
      constructor(options) {
        calls.push(options);
        window.VLibrasWidget = { initBtn: { parentElement: { id: 'vlibras-access', style: {} } } };
      }
    },
  };
}

test('keeps one async script while several route roots initialize before loading', () => {
  const { document, scripts, window } = browserDocument();
  for (let route = 0; route < 5; route++) initializeVLibras(document, window);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].id, VLIBRAS_SCRIPT_ID);
  assert.equal(scripts[0].src, VLIBRAS_SCRIPT_URL);
  assert.equal(scripts[0].async, true);
});

test('configures the right position above center once and preserves it between routes', () => {
  const { document, scripts, window } = browserDocument();
  const calls = [];
  initializeVLibras(document, window);
  officialAPI(window, calls);
  scripts[0].dispatchEvent(new Event('load'));
  const button = window.VLibrasWidget.initBtn;
  for (let route = 0; route < 5; route++) initializeVLibras(document, window);
  scripts[0].dispatchEvent(new Event('load'));
  assert.deepEqual(calls, [{ rootPath: 'https://vlibras.gov.br/app', position: 'R' }]);
  assert.equal(button.parentElement.style.top, 'calc(50vh - 60px)');
  assert.equal(window.VLibrasWidget.initBtn, button);
  assert.equal(scripts.length, 1);
});

test('reuses an already loaded official API and never replaces an existing widget', () => {
  const { document, scripts, window } = browserDocument();
  const calls = [];
  officialAPI(window, calls);
  initializeVLibras(document, window);
  initializeVLibras(document, window);
  assert.equal(calls.length, 1);
  assert.equal(scripts.length, 0);
});

test('does not construct another widget if the official auto-start ran before load', () => {
  const { document, scripts, window } = browserDocument();
  initializeVLibras(document, window);
  const calls = [];
  officialAPI(window, calls);
  window.VLibrasWidget = { initBtn: {} };
  scripts[0].dispatchEvent(new Event('load'));
  assert.equal(calls.length, 0);
});

test('allows a later initialization to retry a network or CSP failure', (t) => {
  t.mock.method(console, 'warn', () => {});
  const { document, scripts, window } = browserDocument();
  initializeVLibras(document, window);
  const failed = scripts[0];
  failed.dispatchEvent(new Event('error'));
  assert.equal(scripts.length, 0);
  assert.equal(console.warn.mock.calls.length, 1);
  initializeVLibras(document, window);
  assert.equal(scripts.length, 1);
  assert.notEqual(scripts[0], failed);
});

test('uses the official absolute URL under either local or production base href', () => {
  for (const base of ['http://localhost:4000/', 'https://repository.example/dspace/']) {
    const { document, scripts, window } = browserDocument(base);
    initializeVLibras(document, window);
    assert.equal(new URL(scripts[0].src, base).href, VLIBRAS_SCRIPT_URL);
  }
});
