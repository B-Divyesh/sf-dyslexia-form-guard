import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const extensionPath = resolve('dist/extension/chrome-mv3');
const profilePath = await mkdtemp(resolve(tmpdir(), 'form-guard-popup-'));
const siteUrl = process.env.FORM_GUARD_TEST_URL || 'http://127.0.0.1:4173';
let context;

try {
  context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const lab = await context.newPage();
  await lab.goto(`${siteUrl}/lab/`, { waitUntil: 'networkidle' });
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'networkidle' });
  await context.setOffline(true);
  await lab.bringToFront();
  await page.locator('#scan-button').click();
  await page.locator('#review-view:not([hidden])').waitFor();
  assert.match(await page.locator('#network-status').textContent() ?? '', /OFFLINE \/ LOCAL/, 'Review must remain local and available after the page goes offline.');
  assert.match(await page.locator('#finding-counter').textContent() ?? '', /3 CHECKS/, 'The seeded lab form must reach extension review with its three expected checks.');

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
  console.log(`Popup speaking-state accessibility: ${results.violations.length} total violation groups, ${blockers.length} serious/critical`);
} finally {
  await context?.close();
  await rm(profilePath, { recursive: true, force: true });
}
