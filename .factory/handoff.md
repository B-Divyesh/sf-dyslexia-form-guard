# Form Guard independent verification 7 handoff — FAIL

**Work order:** `dyslexia-form-guard-verify-7`

**Tested commit:** `5fe649d3024ae1873b221c7316110f49ec91168c`

**Tested URL:** <https://dyslexia-form-guard.sociobot.in>

**Date:** 2026-08-30

**Full evidence:** `.factory/verification-7.md`

## Result

**FAIL.** Fresh evidence clears the prior deployment-only failure: all 17 mandatory claims pass, Guard+ checkout and verification are healthy, rate limiting works, and production matches the candidate. Release is blocked by newly exercised arbitrary-form and consent-boundary failures.

## Release blockers

1. **High — choice state is misrepresented.** A checked checkbox reads `on`; checked and unchecked radios both appear with their raw values. The one-field review does not say which option is selected. A visible contenteditable field is omitted.
2. **High — sensitive-site permission crosses origins.** Enabling `http://127.0.0.1:4173` stores `http://127.0.0.1`, so a password page on `http://127.0.0.1:4174` bypasses the required pause. The implementation drops the port despite promising per-origin consent.
3. **High — claims coverage is incomplete.** The broad visible-editable-field and explicitly-enabled-origin promises have no claim tests for these material boundaries.

## Verified working

- Cold first screen clearly states the job, audience, and action at 1440 × 900 and 390 × 844. One click opens an immediate three-finding, memory-only sample review.
- All 17 literal `.factory/claims.json` commands pass from the exact candidate.
- `npm ci`, 14/14 unit tests, typecheck, zero-warning lint, exact production build, release verification, site/popup browser suites, and production audit pass.
- Seeded review, clean form, Unicode repeat, invalid email, empty/required recovery, offline mode, keyboard, speech, highlight, reset, no edit/submit, free core, and Guard+ ordering work.
- Site and packaged popup live axe runs report 0 violation groups at desktop and 390 px; no console/page errors; reduced motion and 44 px targets pass.
- Privacy request logs contain no form-text egress or tracking. Headers, 404, immutable caching, and links pass.
- Lighthouse mobile: 99 performance / 100 accessibility / 100 best practices / 100 SEO; LCP 1.39 s, TBT 119.5 ms, CLS 0.
- Billing verifier allowance observed: 30 requests per window; excess requests return 429 with `Retry-After: 4`, then recover.
- Live HTML/JS/CSS and every unpacked extension file match the candidate.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:release
npm run test:a11y
npm run test:popup-a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:popup-a11y
```

No product code was modified. Only this verifier report and handoff were changed.
