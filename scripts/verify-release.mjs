import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = resolve('dist/site');
const archive = resolve(site, 'downloads/form-guard-chrome.zip');
const configPath = resolve(site, 'staticwebapp.config.json');

// @claim:installable-mv3
const zip = await readFile(archive);
assert.ok(zip.length > 0, 'The extension download archive must not be empty.');
assert.equal(zip.subarray(0, 2).toString('ascii'), 'PK', 'The extension download must be a ZIP archive.');
execFileSync('unzip', ['-t', archive], { stdio: 'pipe' });
const manifest = JSON.parse(execFileSync('unzip', ['-p', archive, 'manifest.json'], { encoding: 'utf8' }));
const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
assert.equal(manifest.version, packageJson.version, 'The downloadable extension must carry the current release version.');
assert.equal(manifest.manifest_version, 3, 'The downloadable extension must remain an MV3 consumer package.');

const config = JSON.parse(await readFile(configPath, 'utf8'));
assert.equal(config.navigationFallback, undefined, 'This multi-page static site must not rewrite unknown URLs to the homepage.');
assert.equal(config.responseOverrides?.['404']?.rewrite, '/404.html', 'Static host must rewrite missing routes to the designed 404 document.');
assert.equal(config.globalHeaders?.['Referrer-Policy'], 'no-referrer', 'Static host must send the privacy response policy.');
assert.equal(config.globalHeaders?.['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()', 'Static host must disable unused sensitive browser capabilities.');
assert.equal(config.globalHeaders?.['X-Frame-Options'], 'DENY', 'Static host must prevent framing.');
assert.equal(config.globalHeaders?.['Cross-Origin-Opener-Policy'], 'same-origin', 'Static host must isolate its browsing context.');
const csp = config.globalHeaders?.['Content-Security-Policy'] ?? '';
assert.match(csp, /default-src 'self'/, 'Static host must enforce a same-origin CSP.');
assert.match(csp, /frame-ancestors 'none'/, 'CSP must prevent framing.');
assert.match(csp, /connect-src 'self' https:\/\/api\.sociobot\.in/, 'CSP must allow only the billing API beyond same-origin.');

const cacheFor = (route) => config.routes?.find((entry) => entry.route === route)?.headers?.['Cache-Control'];
assert.equal(cacheFor('/assets/*'), 'public, max-age=31536000, immutable');
assert.equal(cacheFor('/fonts/*'), 'public, max-age=31536000, immutable');
assert.equal(cacheFor('/downloads/*'), 'public, max-age=3600');

const pages = [
  ['index.html', 'Form Guard — check forms before submitting', 'https://dyslexia-form-guard.sociobot.in/'],
  ['lab/index.html', 'Demo — Form Guard', 'https://dyslexia-form-guard.sociobot.in/lab/'],
  ['privacy/index.html', 'Privacy — Form Guard', 'https://dyslexia-form-guard.sociobot.in/privacy/'],
  ['terms/index.html', 'Terms — Form Guard', 'https://dyslexia-form-guard.sociobot.in/terms/'],
  ['404.html', 'Page not found — Form Guard', 'https://dyslexia-form-guard.sociobot.in/404.html']
];
for (const [relativePath, title, canonical] of pages) {
  const html = await readFile(resolve(site, relativePath), 'utf8');
  assert.match(html, new RegExp(`<title>${title}</title>`), `${relativePath} must set its route title.`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}"`), `${relativePath} must set its canonical URL.`);
  assert.match(html, /meta property="og:image" content="https:\/\/dyslexia-form-guard\.sociobot\.in\/assets\/form-guard-social\.png"/, `${relativePath} must expose the product social image.`);
  assert.match(html, /meta name="twitter:card" content="summary_large_image"/, `${relativePath} must expose a Twitter card.`);
  assert.match(html, /link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/, `${relativePath} must link an Apple touch icon.`);
  assert.match(html, /Built by Param Factory · v1\.0\.5/, `${relativePath} footer must identify the factory and build version.`);
}
const socialImage = await readFile(resolve(site, 'assets/form-guard-social.png'));
const appleTouch = await readFile(resolve(site, 'apple-touch-icon.png'));
assert.ok(socialImage.length > 10_000, 'The 1200 × 630 product social image must be shipped.');
assert.ok(appleTouch.length > 1_000, 'The Apple touch icon must be shipped.');

console.log('Release artifact includes a valid, current MV3 ZIP download, designed 404 response, route metadata, social assets, and Azure Static Web Apps response policy.');
