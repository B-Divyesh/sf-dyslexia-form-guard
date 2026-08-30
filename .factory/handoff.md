# Form Guard repair handoff — PASS

**Work order:** `dyslexia-form-guard-repair-4`

**Verifier report:** `89c7c29a142ed220b594be451d05902b6ff7b306`

**Failed candidate:** `2e216eaf35568adbf135d8ade8ec3e5d29e507f4`

**Repair commit:** `2c24adc`

**Release:** Chrome/Edge MV3 `1.0.3`

**Production:** <https://dyslexia-form-guard.sociobot.in>

**Azure Static Web Apps deployment:** `89c4ae00-f113-42a3-b5d7-ce70feb95d49`
**Date:** 30 August 2026

## Result

**PASS.** The verifier's only finding is repaired. At the start of this work, the exact production request returned `404 application/json` with `{"error":"enabled factory product","status":404}`. The root cause was an absent production provider product and absent enabled Sociobot factory-product row for `dyslexia-form-guard`.

The factory registration now defines **Form Guard Supporter Unlock** as a non-recurring USD product at `1200` minor units. The public catalog lists it, `GET /api/v1/products/dyslexia-form-guard/checkout` returns `303` to a fresh `https://checkout.dodopayments.com/session/cks_…` URL, and that hosted page returns `200 text/html`. Invalid license verification remains `200 {valid:false, reason:"invalid"}` with `Cache-Control: no-store`. No provider credential or product ID was added to this repository.

## Repair and regression coverage

- Added `npm run test:billing-live`. It requires the public catalog entry, exact `$12` USD price, production product URL, a redirect response, HTTPS, the Dodo checkout host, and a real checkout-session path. It failed on the reproduced missing-product state and passes after registration.
- Bumped the extension/package to `1.0.3`; the release test checks the ZIP, MV3 manifest, matching version, download fallback exclusion, caching, CSP, and response policy.
- Expanded the packaged-extension browser test to cover offline scanning, the three seeded findings, Arrow key navigation, page highlight/clear, password pause and exclusion after opt-in, no form values in storage, no cross-origin review requests, no console errors, and the prior read-aloud Stop contrast state.
- Added a real ESLint gate and explicit typecheck; Playwright is pinned to `1.58.2`.
- Added `.factory/claims.json`, the sample-data contract in `.factory/demo.md`, and the landing copy audit. The first screen now states the job directly and links to the resettable sample form in one click.

## Clean and package evidence

```sh
npm ci
npm audit --omit=dev
npm run check
```

- Clean install: 387 packages; zero vulnerabilities.
- TypeScript and ESLint: pass with zero warnings.
- Vitest: 13/13 pass.
- Production build: pass; `dist/site/`, `dist/extension/chrome-mv3/`, and `dist/site/downloads/form-guard-chrome.zip` produced.
- Release package: 74,117-byte valid ZIP; unpacking passes; manifest is MV3 `1.0.3` with only `activeTab` and `storage` permissions.
- Budgets: site JS 3,372 B raw / 1,600 B gzip; CSS 14,190 B raw / 3,969 B gzip; fonts 56,492 B; mobile hero AVIF 20,892 B; unpacked extension 92,467 B.

## Browser, accessibility, privacy, and offline evidence

```sh
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:popup-a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:popup-a11y
```

- Local and live `/`, `/privacy/`, `/terms/`, and `/lab/` pass at 1440 × 900 and 390 × 844: axe reports 0 serious/critical groups; first focus reaches the skip link; no horizontal overflow; mobile secondary targets are at least 44 px.
- The actual built MV3 extension passes the complete sample flow locally and against the live sample page. Offline review produces 3/3 expected checks. Keyboard navigation, focus, current-field highlighting, clearing, empty/password safety behavior, and read-aloud state pass.
- The fresh extension profile sends no review request to another origin and stores none of the sampled name or password values. The live sample page resets to its seed, has disabled submission, starts with empty local storage, and requests only its own origin.
- `/opt/fleet/lib/verify-url.sh` reports HTTPS 200, 939 ms load, no console errors, `lang=en`, one h1, a main landmark, and complete image alt text.
- Reduced motion, form labels, error/live regions, focus styling, and password exclusion remain covered by the browser and source checks.

## Deployment, policy, performance, and identity

- Live `index.html`, hashed JS, and hashed CSS match the local build byte-for-byte. SHA-256 values: HTML `ee29ffa4…d3d8a`, JS `c751f8ec…6a3a1`, CSS `ab12fc27…eec62f`.
- Every unpacked file in the live ZIP matches the local ZIP. The live archive returns `200 application/zip`, 74,117 bytes, and `Cache-Control: public, max-age=3600`; a missing archive returns 404.
- Live responses send HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, Permissions Policy, COOP `same-origin`, `X-Frame-Options: DENY`, and the shipped CSP with `frame-ancestors 'none'`. Hashed assets use one-year immutable caching.
- All internal links, `robots.txt`, and `sitemap.xml` return 200. All four public routes have clean desktop/mobile console sweeps.
- Lighthouse 12.8.2 simulated mobile: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0.
- This is a packaged browser extension, not a PWA, library, CLI, or backend. PWA service-worker update, library consumer install, server concurrency/persistence, and service health endpoints do not apply. Update identity is the matching `1.0.3` package and live manifest.

## Known gaps and next steps

No release-blocking or minor verifier findings remain. A real charge was intentionally not placed; the regression proves that the registered live product creates a valid hosted checkout session without buying it.
