import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const extensionPath = resolve('dist/extension/chrome-mv3');
const profilePath = await mkdtemp(resolve(tmpdir(), 'form-guard-popup-'));
let context;

try {
  context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'networkidle' });

  // Exercise the exact state that previously failed: Stop is visible while
  // the pointer remains over the control, so hover cannot override its cyan
  // background with the low-contrast console surface.
  await page.evaluate(() => {
    const ready = document.querySelector('#ready-view');
    const review = document.querySelector('#review-view');
    const button = document.querySelector('#speak-button');
    if (!(ready instanceof HTMLElement) || !(review instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
      throw new Error('Popup review controls are unavailable.');
    }
    ready.hidden = true;
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
