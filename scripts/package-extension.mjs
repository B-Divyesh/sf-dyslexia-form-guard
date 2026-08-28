import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const extensionDir = resolve(root, 'dist', 'extension', 'chrome-mv3');
const downloadsDir = resolve(root, 'dist', 'site', 'downloads');
const zipPath = resolve(downloadsDir, 'form-guard-chrome.zip');

await mkdir(downloadsDir, { recursive: true });

await new Promise((resolveArchive, rejectArchive) => {
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolveArchive);
  output.on('error', rejectArchive);
  archive.on('error', rejectArchive);
  archive.pipe(output);
  archive.directory(extensionDir, false);
  void archive.finalize();
});

console.log(`Packaged extension: ${zipPath}`);
