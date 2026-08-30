import { execFileSync } from 'node:child_process';
import { withPreview } from './with-preview.mjs';

await withPreview((baseUrl) => {
  execFileSync('node', ['scripts/a11y-check.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, FORM_GUARD_TEST_URL: baseUrl }
  });
});
