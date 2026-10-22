import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const version = '6.4.299';
export const assetVersion = `${version}-range-2`;
const sha256 = 'c894bce53b2f4c3e13141e088c89cc051a1f7118ba4a2c02ec058798ae1303d1';
const sourceUrl = `https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-legacy-dist.zip`;

/** Configure the official viewer through its AppOptions API before startup. */
export function configureViewer(source) {
  const anchor = '  PDFViewerApplication.run(config);';
  if (source.split(anchor).length !== 2) {
    throw new Error('Unexpected PDF.js startup; review the pinned distribution');
  }
  return 'import { installRepositoryPdfViewer } from "./repository-range-viewer.mjs";\n' + source.replace(anchor, `  // Repository: a read-only viewer, without PDF scripting or saved preferences.
  AppOptions.set("disablePreferences", true);
  AppOptions.set("disableHistory", true);
  AppOptions.set("enableScripting", false);
  AppOptions.set("annotationEditorMode", -1);
  AppOptions.set("enableAltTextModelDownload", false);
  AppOptions.set("defaultUrl", "");
  AppOptions.set("localeProperties", {
    lang: new URLSearchParams(location.search).get("locale") || "pt-BR"
  });
  installRepositoryPdfViewer(PDFViewerApplication);
${anchor}`);
}

async function install(destination, bridge) {
  if (!path.isAbsolute(destination) || path.basename(destination) !== 'pdfjs') {
    throw new Error('Expected an absolute asset directory ending in /pdfjs');
  }
  const temporary = await mkdtemp(path.join(tmpdir(), 'repository-pdfjs-'));
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`PDF.js download failed: ${response.status}`);
    const archive = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(archive).digest('hex') !== sha256) {
      throw new Error('PDF.js SHA-256 mismatch');
    }
    const zip = path.join(temporary, 'pdfjs.zip');
    const extracted = path.join(temporary, 'pdfjs');
    await writeFile(zip, archive);
    const unzip = spawnSync('unzip', ['-q', zip, '-d', extracted], { stdio: 'inherit' });
    if (unzip.error || unzip.status !== 0) throw new Error('Unable to extract PDF.js');
    const viewer = path.join(extracted, 'web', 'viewer.mjs');
    await writeFile(viewer, configureViewer(await readFile(viewer, 'utf8')));
    await writeFile(path.join(extracted, 'web', 'repository-range-viewer.mjs'), await readFile(bridge));
    await rm(path.join(extracted, 'web', 'compressed.tracemonkey-pldi-09.pdf'));
    const assets = path.join(temporary, 'assets');
    await mkdir(assets);
    await rename(extracted, path.join(assets, assetVersion));
    await rm(destination, { recursive: true, force: true });
    await rename(assets, destination);
    console.log(`Installed local PDF.js ${version} (verified SHA-256)`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await install(process.argv[2] ?? '', process.argv[3] ?? new URL('../overrides/pdf-range-viewer.mjs', import.meta.url));
}
