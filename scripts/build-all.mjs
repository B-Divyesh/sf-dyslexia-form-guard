import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
execFileSync('npm', ['run', 'build:site'], { stdio: 'inherit' });
execFileSync('npm', ['run', 'build:extension'], { stdio: 'inherit' });

const extensionDir = resolve(dist, 'extension', 'chrome-mv3');
const downloadsDir = resolve(dist, 'site', 'downloads');
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
