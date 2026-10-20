import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Load the shipped bridge with a minimal substitute for the vendor transport.
const temporary = await mkdtemp(path.join(tmpdir(), 'pdf-range-bridge-test-'));
after(() => rm(temporary, { recursive: true, force: true }));
await mkdir(path.join(temporary, 'build'));
await mkdir(path.join(temporary, 'web'));
await writeFile(path.join(temporary, 'build/pdf.mjs'), `export class PDFDataRangeTransport {
  constructor(length, initialData, progressiveDone, filename) { Object.assign(this, {length, initialData, progressiveDone, filename}); }
  onDataRange(begin, chunk) { this.received = {begin, chunk}; }
}`);
const bridgePath = path.join(temporary, 'web/bridge.mjs');
await writeFile(bridgePath, await readFile(new URL('../../frontend/overrides/pdf-range-viewer.mjs', import.meta.url)));
const { installRepositoryPdfViewer } = await import(pathToFileURL(bridgePath).href);

test('uses a custom range transport without streaming, prefetch or content URLs', async () => {
  let options, ready = false;
  const target = {};
  const application = {
    initializedPromise: Promise.resolve(),
    open: async value => options = value,
    close: async () => {},
  };
  installRepositoryPdfViewer(application, target);
  await target.repositoryPdfViewer.open({
    length: 1024, filename: 'test.pdf',
    readRange: async (begin, end) => runInNewContext(`new ArrayBuffer(${end - begin})`),
    onReady: () => ready = true,
    onError: () => assert.fail('Unexpected error'),
  });
  assert.equal(ready, true);
  assert.equal(options.disableAutoFetch, true);
  assert.equal(options.disableStream, true);
  assert.equal(options.disableRange, false);
  assert.equal(options.rangeChunkSize, 256 * 1024);
  assert.equal(options.range.length, 1024);
  assert.equal(options.range.initialData.byteLength, 0);
  assert.equal(options.range.progressiveDone, true);
  assert.equal(options.url, undefined);
  options.range.requestDataRange(100, 200);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(options.range.received.begin, 100);
  assert.equal(options.range.received.chunk.byteLength, 100);
  assert.ok(options.range.received.chunk.buffer instanceof ArrayBuffer);
});

test('reports range failures and closes the loading task', async () => {
  let options, errors = 0, closes = 0;
  const target = {};
  installRepositoryPdfViewer({
    initializedPromise: Promise.resolve(),
    open: async value => options = value,
    close: async () => closes++,
  }, target);
  await target.repositoryPdfViewer.open({
    length: 1024, filename: 'test.pdf',
    readRange: async () => { throw new Error('Disconnected'); },
    onReady: () => {}, onError: () => errors++,
  });
  options.range.requestDataRange(0, 100);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(errors, 1);
  assert.equal(closes, 1);
});

test('ignores late data after the transport is aborted', async () => {
  let options, resolve;
  const target = {};
  installRepositoryPdfViewer({
    initializedPromise: Promise.resolve(),
    open: async value => options = value,
    close: async () => {},
  }, target);
  await target.repositoryPdfViewer.open({
    length: 1024, filename: 'test.pdf',
    readRange: () => new Promise(done => resolve = done),
    onReady: () => {}, onError: () => assert.fail('Late error'),
  });
  options.range.requestDataRange(0, 100);
  options.range.abort();
  resolve(new ArrayBuffer(100));
  await new Promise(done => setImmediate(done));
  assert.equal(options.range.received, undefined);
});
