import { execFileSync } from 'node:child_process';
import { withPreview } from './with-preview.mjs';

await withPreview((baseUrl) => {
  execFileSync('xvfb-run', ['-a', 'node', 'scripts/popup-a11y-check.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, FORM_GUARD_TEST_URL: baseUrl }
  });
});
