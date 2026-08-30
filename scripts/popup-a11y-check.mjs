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
const claimUnderTest = process.env.FORM_GUARD_CLAIM;
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
  await lab.locator('#sample-form').evaluate((form) => {
    form.addEventListener('submit', () => { form.dataset.formGuardSubmitted = 'true'; });
  });
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
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /3 CHECKS/, 'The seeded lab form must reach extension review with its three expected checks.');
  // @claim:core-review-free
  assert.equal(await page.locator('#flagged-first').isDisabled(), true, 'The core scan must work before any Guard+ license is present.');
  const firstLabel = await page.locator('#field-label').textContent();
  // @claim:keyboard-review-navigation
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('#field-label').textContent(), firstLabel, 'ArrowRight must advance the one-field review.');
  // @claim:field-highlight
  assert.equal(await lab.locator('[data-form-guard-highlighted="true"]').count(), 1, 'The current field must be highlighted on the page.');
  // @claim:read-aloud
  await page.locator('#speak-button').click();
  assert.match(await page.locator('#speak-button').getAttribute('data-last-read') ?? '', /Street address\. 12 Cedar Street\./, 'Read aloud must pass the current label and value to the browser speech API.');
  await page.locator('#speak-button').click();
  await page.locator('#finish-button').click();
  assert.equal(await lab.locator('[data-form-guard-highlighted="true"]').count(), 0, 'Finishing must clear the page highlight.');
  // @claim:never-edits-or-submits
  assert.equal(await lab.locator('#practice-name').inputValue(), 'Sam Rivera', 'Review must not edit form values.');
  assert.equal(await lab.locator('#sample-form').evaluate((form) => form.dataset.formGuardSubmitted ?? ''), '', 'Review must not submit the form.');

  await context.setOffline(false);
  const legacyHostPermission = `${new URL(siteOrigin).protocol}//${new URL(siteOrigin).hostname}`;
  await worker.evaluate((allowedSite) => chrome.storage.local.set({ allowedSites: [allowedSite] }), legacyHostPermission);
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

  if (claimUnderTest !== 'editable-control-review') {
    const secondOrigin = 'http://127.0.0.1:4174';
    await context.route(`${secondOrigin}/**`, (route) => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>Other origin form</title></head><body><main><h1>Account</h1><label>Password <input type="password" value="OTHER-SECRET-4174"></label><label>Reference <input value="B-204"></label></main></body></html>'
    }));
    const otherOriginPage = await context.newPage();
    await otherOriginPage.goto(`${secondOrigin}/form`, { waitUntil: 'domcontentloaded' });
    outboundRequests.length = 0;
    await otherOriginPage.bringToFront();
    await page.locator('#scan-button').click();
    await page.locator('#blocked-view:not([hidden])').waitFor();
    // @claim:origin-scoped-permission
    assert.match(await page.locator('#blocked-detail').textContent() ?? '', /page with a password field/, 'Enabling one non-default-port origin must not authorize another port on the same hostname.');
    const originPermission = await worker.evaluate(() => chrome.storage.local.get(['allowedSites', 'allowedSitesVersion']));
    assert.deepEqual(originPermission.allowedSites, [siteOrigin], 'The stored permission must retain the complete enabled origin, including its port.');
    assert.equal(originPermission.allowedSitesVersion, 2, 'Origin permissions must use the current exact-origin storage format.');
    await page.locator('#cancel-block-button').click();
    await otherOriginPage.close();
    await lab.bringToFront();
  }

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
  // @claim:native-validation-alerts
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /1 CHECK/, 'A blank native required field must produce a check after empty-state recovery.');
  await page.locator('#finish-button').click();
  await lab.locator('#recovery-reference').fill('A-104');
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /NO ALERTS/, 'Repairing the required field must rescan cleanly.');
  await page.locator('#finish-button').click();

  await lab.locator('#sample-form').evaluate((form) => {
    form.replaceChildren();
    const addInput = (labelText, type, checked = false) => {
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement('input');
      input.type = type;
      input.checked = checked;
      input.name = type === 'radio' ? 'plan' : labelText.toLowerCase();
      input.value = labelText.toLowerCase();
      label.append(input);
      form.append(label);
    };
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Full name';
    const name = document.createElement('input');
    name.value = 'Sam Rivera';
    nameLabel.append(name);
    form.append(nameLabel);
    addInput('Consent', 'checkbox', true);
    addInput('Updates', 'checkbox', false);
    addInput('Basic', 'radio', false);
    addInput('Premium', 'radio', true);
    const countryLabel = document.createElement('label');
    countryLabel.textContent = 'Country';
    const country = document.createElement('select');
    country.append(new Option('India', 'in', true, true));
    countryLabel.append(country);
    form.append(countryLabel);
    const notes = document.createElement('div');
    notes.contentEditable = 'true';
    notes.tabIndex = 0;
    notes.setAttribute('role', 'textbox');
    notes.setAttribute('aria-label', 'Visible notes');
    notes.textContent = 'Leave at reception';
    form.append(notes);
  });
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  const reviewedControls = [];
  while (true) {
    const currentLabel = await page.locator('#field-label').textContent();
    const currentValue = await page.locator('#field-value').textContent();
    reviewedControls.push([currentLabel, currentValue]);
    if (currentLabel === 'Basic') {
      await page.locator('#speak-button').click();
      assert.match(await page.locator('#speak-button').getAttribute('data-last-read') ?? '', /Basic\. Not selected\./, 'Read aloud must speak the unselected radio state.');
      await page.locator('#speak-button').click();
    }
    if (await page.locator('#next-button').isDisabled()) break;
    await page.locator('#next-button').click();
  }
  // @claim:editable-control-review
  assert.deepEqual(reviewedControls, [
    ['Full name', 'Sam Rivera'],
    ['Consent', 'Checked'],
    ['Updates', 'Not checked'],
    ['Basic', 'Not selected'],
    ['Premium', 'Selected'],
    ['Country', 'India'],
    ['Visible notes', 'Leave at reception']
  ], 'The packaged review must expose choice state and include a visible contenteditable field.');
  await page.locator('#finish-button').click();

  await lab.locator('#sample-form').evaluate((form) => form.replaceChildren());
  await lab.locator('#sample-form').evaluate((form) => {
    const addField = (labelText, fieldValue, type = 'text') => {
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement('input');
      input.type = type;
      input.value = fieldValue;
      input.id = `plus-${labelText.toLowerCase().replace(/\s+/g, '-')}`;
      label.htmlFor = input.id;
      label.append(input);
      form.append(label);
    };
    addField('Full name', 'Sam Rivera');
    addField('Email', 'sam@example.com', 'email');
    addField('Confirm email', 'sma@example.com', 'email');
    addField('Delivery notes', 'Send the the receipt to my emial address.');
  });
  await worker.evaluate(() => chrome.storage.local.set({ licenseCache: { valid: true, checkedAt: Date.now() }, flaggedFirst: true }));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#plus-details').evaluate((details) => { details.open = true; });
  await page.locator('#flagged-first').waitFor({ state: 'visible' });
  // @claim:guard-plus-flagged-first
  assert.equal(await page.locator('#flagged-first').isEnabled(), true, 'A valid Guard+ cache must enable flagged-first ordering.');
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  assert.ok(['Email', 'Confirm email', 'Delivery notes'].includes(await page.locator('#field-label').textContent() ?? ''), 'Flagged-first ordering must place a flagged field before clean fields.');
  await page.locator('#finish-button').click();
  assert.deepEqual(outboundRequests, [], 'All packaged extension scenarios must remain local.');
  assert.deepEqual(consoleErrors, [], 'All packaged extension scenarios must remain console-error free.');
  console.log(`Packaged popup flow: offline, keyboard, password, privacy, empty recovery, native validation, and speaking state passed; ${results.violations.length} axe groups, ${blockers.length} serious/critical`);
} finally {
  await context?.close();
  await rm(profilePath, { recursive: true, force: true });
}
