import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const initializer = new URL('frontend/overrides/color-mode-init.js', root);
const patch = new URL('frontend/patches/apply-color-mode-init.mjs', root);
const script = readFileSync(initializer, 'utf8');

function firstPaint(storage) {
  const attributes = {};
  vm.runInNewContext(script, {
    document: { documentElement: { setAttribute: (key, value) => attributes[key] = value } },
    localStorage: storage,
    // A system preference must never opt a new visitor into dark mode.
    matchMedia: () => ({ matches: true }),
  });
  return attributes['data-bs-theme'];
}

test('first visit stays light even when the system uses dark mode', () => {
  assert.equal(firstPaint({ getItem: () => null }), 'light');
});

test('only an explicitly saved dark preference enables dark mode before paint', () => {
  assert.equal(firstPaint({ getItem: () => 'dark' }), 'dark');
  for (const value of ['light', 'auto', 'DARK', '', 'invalid']) {
    assert.equal(firstPaint({ getItem: () => value }), 'light');
  }
});

test('blocked or unavailable browser storage falls back to light mode', () => {
  assert.equal(firstPaint({ getItem: () => { throw new Error('Storage blocked'); } }), 'light');
  assert.equal(firstPaint(undefined), 'light');
});

test('the index patch runs before styles, keeps the base URL and is repeatable', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'ufal-color-mode-'));
  try {
    const index = path.join(directory, 'index.html');
    writeFileSync(index, '<html>\n<head><meta charset="UTF-8"><base href="/dspace/"><link rel="stylesheet" href="theme.css"></head><body></body></html>');
    const args = [patch.pathname, index, initializer.pathname];
    execFileSync(process.execPath, args);
    const first = readFileSync(index, 'utf8');
    assert.ok(first.includes('<html data-bs-theme="light">'));
    assert.ok(first.includes('<base href="/dspace/">'));
    assert.ok(first.indexOf('ufal-color-mode-init') < first.indexOf('rel="stylesheet"'));
    execFileSync(process.execPath, args);
    assert.equal(readFileSync(index, 'utf8'), first);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('the patch fails without modifying an unexpected upstream index', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'ufal-color-mode-'));
  try {
    const index = path.join(directory, 'index.html');
    const source = '<html lang="en"><head></head><body></body></html>';
    writeFileSync(index, source);
    const result = spawnSync(process.execPath, [patch.pathname, index, initializer.pathname]);
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(index, 'utf8'), source);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
