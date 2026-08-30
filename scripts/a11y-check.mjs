import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const baseUrl = process.env.FORM_GUARD_TEST_URL || 'http://127.0.0.1:4173';
const routes = ['/', '/privacy/', '/terms/', '/lab/'];
const browser = await chromium.launch();
let failed = false;

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).analyze();
    const blockers = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    console.log(`${viewport.name} ${route}: ${results.violations.length} total violation groups, ${blockers.length} serious/critical`);
    for (const violation of blockers) {
      console.error(`  ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes) console.error(`    ${node.target.join(' ')}`);
    }
    failed ||= blockers.length > 0;

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) {
      console.error(`  ${viewport.name} ${route}: horizontal overflow`);
      failed = true;
    }

    await page.keyboard.press('Tab');
    if (!await page.locator('.skip-link:focus').count()) {
      console.error(`  ${viewport.name} ${route}: first keyboard focus did not reach the skip link`);
      failed = true;
    }

    if (route === '/lab/') {
      // @claim:sample-demo-reset
      await page.locator('#practice-name').fill('Changed sample value');
      await page.getByRole('button', { name: 'Reset demo' }).click();
      const sampleReset = await page.locator('#practice-name').inputValue() === 'Sam Rivera';
      const submitDisabled = await page.getByRole('button', { name: 'Practice submit (disabled)' }).isDisabled();
      if (!sampleReset || !submitDisabled) {
        console.error(`  ${viewport.name} ${route}: sample reset or disabled submit failed`);
        failed = true;
      }
    }

    if (viewport.name === 'mobile') {
      const targets = await page.locator('.site-header .logo, .site-footer nav a').evaluateAll((nodes) => nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { label: node.getAttribute('aria-label') || node.textContent?.trim(), width: box.width, height: box.height };
      }));
      for (const target of targets) {
        if (target.width < 44 || target.height < 44) {
          console.error(`  mobile ${route}: undersized target ${target.label} (${target.width}×${target.height})`);
          failed = true;
        }
      }
    }
  }
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
