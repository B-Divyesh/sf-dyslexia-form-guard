import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const baseUrl = process.env.FORM_GUARD_TEST_URL || 'http://127.0.0.1:4173';
const routes = ['/', '/privacy/', '/terms/', '/lab/'];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
let failed = false;

for (const route of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  console.log(`${route}: ${results.violations.length} total violation groups, ${blockers.length} serious/critical`);
  for (const violation of blockers) {
    console.error(`  ${violation.id}: ${violation.help}`);
    for (const node of violation.nodes) console.error(`    ${node.target.join(' ')}`);
  }
  failed ||= blockers.length > 0;
}

await browser.close();
process.exit(failed ? 1 : 0);
