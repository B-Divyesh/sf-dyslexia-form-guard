import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = resolve('dist/site');
const archive = resolve(site, 'downloads/form-guard-chrome.zip');
const configPath = resolve(site, 'staticwebapp.config.json');

const zip = await readFile(archive);
assert.ok(zip.length > 0, 'The extension download archive must not be empty.');
assert.equal(zip.subarray(0, 2).toString('ascii'), 'PK', 'The extension download must be a ZIP archive.');
execFileSync('unzip', ['-t', archive], { stdio: 'pipe' });
const manifest = JSON.parse(execFileSync('unzip', ['-p', archive, 'manifest.json'], { encoding: 'utf8' }));
const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
assert.equal(manifest.version, packageJson.version, 'The downloadable extension must carry the current release version.');
assert.equal(manifest.manifest_version, 3, 'The downloadable extension must remain an MV3 consumer package.');

const config = JSON.parse(await readFile(configPath, 'utf8'));
assert.ok(config.navigationFallback?.exclude?.includes('/downloads/*'), 'Static host fallback must not rewrite extension downloads to index.html.');
assert.equal(config.globalHeaders?.['Referrer-Policy'], 'no-referrer', 'Static host must send the privacy response policy.');
assert.equal(config.globalHeaders?.['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()', 'Static host must disable unused sensitive browser capabilities.');

const cacheFor = (route) => config.routes?.find((entry) => entry.route === route)?.headers?.['Cache-Control'];
assert.equal(cacheFor('/assets/*'), 'public, max-age=31536000, immutable');
assert.equal(cacheFor('/fonts/*'), 'public, max-age=31536000, immutable');
assert.equal(cacheFor('/downloads/*'), 'public, max-age=3600');

console.log('Release artifact includes a valid, current MV3 ZIP download and Azure Static Web Apps response policy.');
