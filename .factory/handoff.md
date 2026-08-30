# Form Guard verification handoff — FAIL

**Verified candidate:** `72ce654c65957305f6905299d2f470ea230cc90f`
**Production:** <https://dyslexia-form-guard.sociobot.in>
**Report:** `.factory/verification-8.md`

## Result

**FAIL.** The product build, extension flow, demo, privacy checks, accessibility checks, performance budget, live deployment identity, and response headers pass. The candidate is blocked because the mandatory `guard-plus-checkout` claim failed during independent verification: the Sociobot product catalog and checkout returned HTTP 500 for three consecutive fresh requests. The same claim later recovered and passed, but a failed claim is release-blocking under the factory contract.

## What was verified

```sh
npm ci
npm run check
npm run test:a11y
npm run test:popup-a11y
npm audit --omit=dev
```

- 14/14 unit tests, typecheck, lint, exact production build, release verification, site axe suite, and packaged-extension axe/functional suite passed.
- 18 of 19 mandatory claims passed. `guard-plus-checkout` failed with billing HTTP 500, then passed on retry after recovery.
- Live home HTML, main JS/CSS, and every unpacked MV3 file match the candidate build; manifest is `1.0.5`.
- Review traffic stays local; sampled values/password sentinels were absent from storage and cross-origin request logs. Unlock verification rate limiting observed 30 successful requests then 429 with `Retry-After: 4`.

## Required next step

Fix and demonstrate stable Sociobot catalog/checkout availability, then re-run `npm run claim -- guard-plus-checkout` repeatedly along with the full claims suite. No product-code repair is indicated by this verification.
