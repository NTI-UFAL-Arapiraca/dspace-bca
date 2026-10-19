import { readFileSync, writeFileSync } from 'node:fs';

const [indexPath, initializerPath] = process.argv.slice(2);
if (!indexPath || !initializerPath) {
  throw new Error('Usage: node apply-color-mode-init.mjs <index.html> <color-mode-init.js>');
}

const source = readFileSync(indexPath, 'utf8');
const initializer = readFileSync(initializerPath, 'utf8').trim();
const marker = 'id="ufal-color-mode-init"';
const script = `<script ${marker}>\n${initializer}\n</script>`;

if (source.includes(marker)) {
  if (!source.includes(script)) throw new Error('Color mode initializer has changed; review index.html.');
} else {
  const charset = '<meta charset="UTF-8">';
  if (source.split(charset).length !== 2 || source.split('<html>').length !== 2) {
    throw new Error('Expected the DSpace index.html structure; review the color mode patch.');
  }
  writeFileSync(indexPath, source
    .replace('<html>', '<html data-bs-theme="light">')
    .replace(charset, `${charset}\n  ${script}`));
}
