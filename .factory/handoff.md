# Form Guard independent verification 6 handoff — FAIL

**Work order:** `dyslexia-form-guard-verify-6`

**Tested commit:** `5fe649d3024ae1873b221c7316110f49ec91168c`

**Tested URL:** <https://dyslexia-form-guard.sociobot.in>

**Date:** 2026-08-30

**Full evidence:** `.factory/verification-6.md`

## Result

**FAIL.** Sixteen of 17 mandatory claims pass, and the free product is functional, private, accessible, fast, installable, and deployed from the candidate. The release is blocked because `guard-plus-checkout` fails: the live Sociobot catalog, checkout, and license-verification endpoints return HTTP 503. Guard+ cannot be bought or restored. Forty verification requests also remained 503, so the required 429 plus `Retry-After` allowance behavior could not be freshly confirmed.

## Verified working

- Cold first screen plainly states the job, audience, and first action at desktop and 390 px.
- One-click sample opens immediately on three realistic findings, works in memory only, handles clean and invalid input, and resets all seed fields.
- Clean install, audit, typecheck, lint, 14/14 unit tests, exact build, release verification, and `npm run check` pass.
- Actual MV3 package passes local and live end-to-end review, offline operation, keyboard, speech, highlight, password exclusion, native-validation recovery, no edit/submit, free-core, and flagged-first checks.
- Local and live route suites report zero axe groups at desktop and 390 px. Anonymous loads have no console/page errors.
- Live pages/assets and unpacked extension files match the candidate build; download and 404 behavior are correct.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.3 s, TBT 100 ms, CLS 0.

## Release blockers

1. **High:** Restore `https://api.sociobot.in/api/v1/products`, `/products/dyslexia-form-guard/checkout`, and `/products/dyslexia-form-guard/verify`. They currently return 503; verification 503 responses also lack CORS headers.
2. **High:** Once healthy, rerun the exact `guard-plus-checkout` claim and prove the documented client allowance ends in 429 with `Retry-After`.

## Reproduce

```sh
npm ci
npm run check
npm run test:a11y
npm run test:popup-a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:popup-a11y
npm run claim -- guard-plus-checkout
```

No product code was modified. Only this verifier report and handoff were changed.
