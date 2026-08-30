import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const extensionPath = resolve('dist/extension/chrome-mv3');
const profilePath = await mkdtemp(resolve(tmpdir(), 'form-guard-popup-'));
const siteUrl = process.env.FORM_GUARD_TEST_URL || 'http://127.0.0.1:4173';
const siteOrigin = new URL(siteUrl).origin;
let context;

try {
  context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const consoleErrors = [];
  const outboundRequests = [];
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== siteOrigin) outboundRequests.push(request.url());
  });
  const lab = await context.newPage();
  lab.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  lab.on('pageerror', (error) => consoleErrors.push(error.message));
  await lab.goto(`${siteUrl}/lab/`, { waitUntil: 'networkidle' });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'networkidle' });
  await context.setOffline(true);
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  // @claim:offline-local-review
  assert.match(await page.locator('#network-status').textContent() ?? '', /OFFLINE \/ LOCAL/, 'Review must remain local and available after the page goes offline.');
  // @claim:seeded-checks
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /3 CHECKS/, 'The seeded lab form must reach extension review with its three expected checks.');
  const firstLabel = await page.locator('#field-label').textContent();
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('#field-label').textContent(), firstLabel, 'ArrowRight must advance the one-field review.');
  assert.equal(await lab.locator('[data-form-guard-highlighted="true"]').count(), 1, 'The current field must be highlighted on the page.');
  await page.locator('#finish-button').click();
  assert.equal(await lab.locator('[data-form-guard-highlighted="true"]').count(), 0, 'Finishing must clear the page highlight.');

  await context.setOffline(false);
  await lab.locator('#sample-form').evaluate((form) => {
    const password = document.createElement('input');
    password.type = 'password';
    password.value = 'TOP-SECRET-998';
    password.setAttribute('aria-label', 'Password');
    form.append(password);
  });
  await page.locator('#scan-button').click();
  await page.locator('#blocked-view:not([hidden])').waitFor();
  await page.locator('#enable-site-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();

  const shownValues = [];
  while (true) {
    shownValues.push(await page.locator('#field-value').textContent());
    if (await page.locator('#next-button').isDisabled()) break;
    await page.locator('#next-button').click();
  }
  // @claim:password-exclusion
  assert.ok(!shownValues.join(' ').includes('TOP-SECRET-998'), 'Password values must never enter the review.');
  const stored = await worker.evaluate(() => chrome.storage.local.get(null));
  // @claim:privacy-local-only
  assert.ok(!JSON.stringify(stored).includes('TOP-SECRET-998'), 'Password values must never enter extension storage.');
  assert.ok(!JSON.stringify(stored).includes('Sam Rivera'), 'Reviewed form values must never enter extension storage.');
  assert.deepEqual(outboundRequests, [], 'Review must not send form values or analytics to another origin.');
  assert.deepEqual(consoleErrors, [], 'The packaged extension flow must not produce console or page errors.');

  // Exercise the exact state that previously failed: Stop is visible while
  // the pointer remains over the control, so hover cannot override its cyan
  // background with the low-contrast console surface.
  await page.evaluate(() => {
    const review = document.querySelector('#review-view');
    const button = document.querySelector('#speak-button');
    if (!(review instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
      throw new Error('Popup review controls are unavailable.');
    }
    review.hidden = false;
    button.classList.add('speaking');
    const label = button.querySelector('span');
    if (label) label.textContent = 'Stop';
  });
  await page.hover('#speak-button');
  const stopStyle = await page.locator('#speak-button').evaluate((button) => {
    const label = button.querySelector('span');
    const buttonStyle = getComputedStyle(button);
    return {
      label: label?.textContent,
      color: buttonStyle.color,
      background: buttonStyle.backgroundColor
    };
  });
  assert.equal(stopStyle.label, 'Stop', 'The active read-aloud control must name its stop action.');
  assert.equal(stopStyle.color, 'rgb(9, 12, 20)', 'Stop text must retain the dark high-contrast foreground while hovered.');
  assert.equal(stopStyle.background, 'rgb(101, 217, 232)', 'Stop must retain its cyan high-contrast background while hovered.');
  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  for (const violation of blockers) {
    console.error(`${violation.id}: ${violation.help}`);
    for (const node of violation.nodes) console.error(`  ${node.target.join(' ')}`);
  }
  if (blockers.length) process.exitCode = 1;

  await page.locator('#finish-button').click();
  await lab.locator('#sample-form').evaluate((form) => form.replaceChildren());
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#empty-view:not([hidden])').waitFor();
  await lab.locator('#sample-form').evaluate((form) => {
    const label = document.createElement('label');
    label.textContent = 'Reference';
    const input = document.createElement('input');
    input.required = true;
    input.id = 'recovery-reference';
    label.htmlFor = input.id;
    form.append(label, input);
  });
  await lab.bringToFront();
  await page.locator('#empty-view .retry-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /1 CHECK/, 'A blank native required field must produce a check after empty-state recovery.');
  await page.locator('#finish-button').click();
  await lab.locator('#recovery-reference').fill('A-104');
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /NO ALERTS/, 'Repairing the required field must rescan cleanly.');
  assert.deepEqual(outboundRequests, [], 'All packaged extension scenarios must remain local.');
  assert.deepEqual(consoleErrors, [], 'All packaged extension scenarios must remain console-error free.');
  console.log(`Packaged popup flow: offline, keyboard, password, privacy, empty recovery, native validation, and speaking state passed; ${results.violations.length} axe groups, ${blockers.length} serious/critical`);
} finally {
  await context?.close();
  await rm(profilePath, { recursive: true, force: true });
}
