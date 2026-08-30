import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const baseUrl = process.env.FORM_GUARD_TEST_URL || 'http://127.0.0.1:4173';
const routes = ['/', '/privacy/', '/terms/', '/lab/', '/404.html'];
const browser = await chromium.launch();
let failed = false;

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  for (const route of routes) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).analyze();
    const blockers = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    console.log(`${viewport.name} ${route}: ${results.violations.length} total violation groups, ${blockers.length} serious/critical`);
    for (const violation of blockers) {
      console.error(`  ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes) console.error(`    ${node.target.join(' ')}`);
    }
    failed ||= blockers.length > 0;

    const structure = await page.evaluate(() => ({
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      mainCount: document.querySelectorAll('main').length,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      appleTouch: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
      headerLinks: [...document.querySelectorAll('.site-header nav a')].map((link) => link.textContent?.trim()),
      hasFactoryCredit: document.body.textContent?.includes('Built by Param Factory')
    }));
    if (!structure.title || structure.h1Count !== 1 || structure.mainCount !== 1 || !structure.canonical || !structure.ogImage || structure.twitterCard !== 'summary_large_image' || !structure.appleTouch || !structure.hasFactoryCredit) {
      console.error(`  ${viewport.name} ${route}: title, landmarks, social metadata, or factory footer identity is incomplete`);
      failed = true;
    }
    if (structure.headerLinks.join('|') !== 'Demo|How it works|Privacy|Terms') {
      console.error(`  ${viewport.name} ${route}: header navigation is not the shared site shell`);
      failed = true;
    }

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
      // @claim:sample-demo-review
      const immediateReview = await page.locator('#demo-finding-counter').textContent() === '3 CHECKS'
        && await page.locator('#demo-field-label').textContent() === 'Delivery notes'
        && await page.locator('#demo-findings .finding').count() === 2;
      if (!immediateReview) {
        console.error(`  ${viewport.name} ${route}: sample demo did not show an immediate local review result`);
        failed = true;
      }

      // @claim:sample-demo-reset
      await page.locator('#practice-name').fill('Changed sample value');
      await page.getByRole('button', { name: 'Reset demo' }).click();
      const sampleReset = await page.locator('#practice-name').inputValue() === 'Sam Rivera';
      const submitDisabled = await page.getByRole('button', { name: 'Practice submit (disabled)' }).isDisabled();
      if (!sampleReset || !submitDisabled) {
        console.error(`  ${viewport.name} ${route}: sample reset or disabled submit failed`);
        failed = true;
      }

      const demoStorage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
      if (demoStorage.local.length || demoStorage.session.length) {
        console.error(`  ${viewport.name} ${route}: sample demo wrote browser storage`);
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

    if (consoleErrors.length) {
      console.error(`  ${viewport.name} ${route}: console errors: ${consoleErrors.join(' | ')}`);
      failed = true;
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
