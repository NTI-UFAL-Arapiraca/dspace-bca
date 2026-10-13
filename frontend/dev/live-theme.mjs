import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = '/workspace/frontend/themes';
const targetRoot = '/app/src/themes';
const i18nRoot = '/app/src/assets/i18n';
const knownFiles = new Map();
const originalThemeFiles = new Map();
const originalLanguages = new Map();

async function* filesIn(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      yield* filesIn(path.join(directory, entry.name), name);
    } else if (entry.isFile()) {
      yield name;
    }
  }
}

async function mergeLanguages() {
  for (const [name, original] of originalLanguages) {
    await writeFile(path.join(i18nRoot, name), original);
  }
  const result = spawnSync('npm', [
    'run', 'merge-i18n', '--', '-s', 'src/themes/custom/assets/i18n',
  ], { cwd: '/app', stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`merge-i18n failed with status ${result.status}`);
  }
}

async function syncTheme() {
  const currentFiles = new Set();
  let translationsChanged = false;

  for await (const relative of filesIn(sourceRoot)) {
    currentFiles.add(relative);
    const source = path.join(sourceRoot, relative);
    const content = await readFile(source);
    const hash = createHash('sha256').update(content).digest('hex');
    if (knownFiles.get(relative) === hash) continue;

    const target = path.join(targetRoot, relative);
    if (!originalThemeFiles.has(relative)) {
      originalThemeFiles.set(relative, await readFile(target).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      }));
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
    knownFiles.set(relative, hash);
    console.log(`Theme updated: ${relative}`);

    if (relative.startsWith('custom/assets/i18n/')) {
      const language = path.basename(relative);
      if (!originalLanguages.has(language)) {
        originalLanguages.set(language, await readFile(path.join(i18nRoot, language)));
      }
      translationsChanged = true;
    }
  }

  for (const relative of knownFiles.keys()) {
    if (currentFiles.has(relative)) continue;
    const target = path.join(targetRoot, relative);
    const original = originalThemeFiles.get(relative);
    if (original === null) await rm(target, { force: true });
    else await writeFile(target, original);
    knownFiles.delete(relative);
    originalThemeFiles.delete(relative);
    console.log(`Theme removed: ${relative}`);
    if (relative.startsWith('custom/assets/i18n/')) translationsChanged = true;
  }

  if (translationsChanged) await mergeLanguages();
}

await syncTheme();

const server = spawn('npm', ['run', 'serve', '--', '--poll', '2000'], {
  cwd: '/app', stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' },
});

let syncing = false;
const timer = setInterval(async () => {
  if (syncing) return;
  syncing = true;
  try {
    await syncTheme();
  } catch (error) {
    console.error(error);
  } finally {
    syncing = false;
  }
}, 2000);

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
server.on('exit', (code, signal) => {
  clearInterval(timer);
  process.exit(code ?? (signal ? 1 : 0));
});
