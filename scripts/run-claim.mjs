import { execFileSync } from 'node:child_process';

const claim = process.argv[2];
const unitClaims = new Map([
  ['seeded-checks', ['src/lib/analyzer.test.ts', 'three documented issues']],
  ['false-alert-limit', ['src/lib/analyzer.test.ts', 'ordinary uses of from']],
  ['sensitive-domain-pause', ['src/lib/domain-policy.test.ts', 'known banking and health providers']]
]);
const popupClaims = new Set([
  'offline-local-review', 'core-review-free', 'password-exclusion', 'privacy-local-only', 'read-aloud',
  'field-highlight', 'keyboard-review-navigation', 'never-edits-or-submits',
  'native-validation-alerts', 'guard-plus-flagged-first'
]);
const siteClaims = new Set(['sample-demo-review', 'sample-demo-reset']);

if (!claim) throw new Error('Pass one claim id, for example: npm run claim -- seeded-checks');

if (unitClaims.has(claim)) {
  const [file, tag] = unitClaims.get(claim);
  execFileSync('npm', ['test', '--', file, '-t', tag], { stdio: 'inherit' });
} else if (popupClaims.has(claim)) {
  execFileSync('npm', ['run', 'test:popup-a11y'], { stdio: 'inherit' });
} else if (siteClaims.has(claim)) {
  execFileSync('npm', ['run', 'test:a11y'], { stdio: 'inherit' });
} else if (claim === 'installable-mv3') {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  execFileSync('npm', ['run', 'test:release'], { stdio: 'inherit' });
} else if (claim === 'guard-plus-checkout') {
  execFileSync('npm', ['run', 'test:billing-live'], { stdio: 'inherit' });
} else {
  throw new Error(`Unknown claim id: ${claim}`);
}
