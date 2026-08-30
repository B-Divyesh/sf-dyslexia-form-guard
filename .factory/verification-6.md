# Independent verification 6 — FAIL

**Date:** 2026-08-30

**Candidate:** `5fe649d3024ae1873b221c7316110f49ec91168c`

**Branch:** `main` (`origin/main` was the same SHA)

**Production URL:** <https://dyslexia-form-guard.sociobot.in>

**Artifact:** Chrome/Edge Manifest V3 extension `1.0.4`

## Verdict

**FAIL.** The free, local form-review product, its one-click demo, build, deployment, accessibility, privacy boundary, and performance all pass independent testing. The release nevertheless fails the explicit claims gate: the declared `guard-plus-checkout` command returns HTTP 503 because the live Sociobot catalog is unavailable. Direct checkout and license-verification requests also return 503. Guard+ cannot be bought or restored, and the required fresh 429/`Retry-After` allowance check cannot be completed.

This is fresh production evidence, not a repetition of the builder's report. Sixteen of 17 claim commands passed before any other repository inspection. The seventeenth failed during the mandatory first-run claims gate and again later. The acceptance contract says any failed claim test blocks release.

No product code was modified during verification.

## Mandatory first-read and demo gate

The cold live page passes the first-read test at desktop and 390 px:

- What it does: **“Check important forms before you submit.”**
- Who it serves: **“For dyslexic people who want to catch repeated words, swapped letters, and mismatched retyped values without sharing form data.”**
- What to click: **“Try it with sample data”** is visible in the first viewport (top 577 px, bottom 629 px on a 390 × 844 viewport).
- The same screen gives private, offline, and price facts.

One click opens `/lab/`. At both 1440 × 900 and 390 × 844 it immediately shows **Delivery notes**, **3 CHECKS**, the repeated-word finding, and the `emial` → `email` finding. The persistent banner says **Demo — sample data, nothing is saved** and provides **Reset demo** and **Start for real**.

Independent demo flow evidence:

- ArrowLeft moved from Delivery notes to Confirm email.
- Replacing the seeded issues with ordinary clean text including “from” produced **NO ALERTS**.
- An invalid email produced the browser validation finding plus the expected retyped-value mismatch; correcting it returned to **NO ALERTS**.
- Reset restored all five exact seeded values and the three checks.
- Local and session storage remained empty.
- Home → demo requested only `dyslexia-form-guard.sociobot.in` and produced no console/page errors.

## Claims gate

`.factory/claims.json` exists and contains 17 claims. Each declared command was run literally and independently from the clean candidate before other inspection; every command starts with `npm ci`. Claim-tag inventory found exactly one `@claim:<id>` occurrence for every entry.

| Claim | Result | Evidence |
| --- | --- | --- |
| `seeded-checks` | PASS | Seed produces repeat, adjacent-swap, and mismatch findings in order. |
| `false-alert-limit` | PASS | Two ordinary “from” fields produce zero findings. |
| `sensitive-domain-pause` | PASS | Government and listed HSBC, Barclays, Mayo, Cleveland Clinic, and Stanford Health cases pause. |
| `offline-local-review` | PASS | Packaged MV3 scan completed after Chromium went offline. |
| `core-review-free` | PASS | Unlicensed profile completed the three-check review. |
| `password-exclusion` | PASS | Password sentinel never appeared in review or storage. |
| `privacy-local-only` | PASS | Review made no outbound request and stored no field values. |
| `read-aloud` | PASS | Current label/value reached the browser speech API path. |
| `field-highlight` | PASS | Exactly one current page field was highlighted. |
| `keyboard-review-navigation` | PASS | ArrowRight advanced the extension review. |
| `never-edits-or-submits` | PASS | Seed value was unchanged and no submit event fired. |
| `native-validation-alerts` | PASS | Required blank produced one check; valid recovery produced none. |
| `guard-plus-flagged-first` | PASS | A valid cached verdict enabled flagged-first ordering. |
| `installable-mv3` | PASS | Build, ZIP integrity, MV3 manifest, routes, and response policy passed. |
| `sample-demo-review` | PASS | Desktop and mobile opened directly on three checks and two visible details. |
| `sample-demo-reset` | PASS | Desktop/mobile reset and empty storage checks passed. |
| `guard-plus-checkout` | **FAIL** | `npm ci && npm run claim -- guard-plus-checkout` received catalog HTTP **503**, expected 200. |

The failing assertion was `The Sociobot product catalog must be available. 503 !== 200`. A later independent `npm run test:billing-live` failed identically.

## Clean install, tests, and production build

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2`.

- `npm ci`: pass; 387 packages installed, 0 audit vulnerabilities.
- `npm audit --omit=dev`: pass; 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm run lint`: pass with zero warnings.
- `npm test`: pass; **14/14** tests across analyzer, domain policy, and label extraction.
- `npm run build`: pass; produced `dist/site/`, unpacked MV3 output, and download ZIP.
- `npm run test:release`: pass.
- `npm run check`: pass end to end.
- `unzip -t dist/site/downloads/form-guard-chrome.zip`: pass.

## Extension end-to-end evidence

The repository harness loaded the actual production MV3 package in a fresh Chromium profile against both the local production build and the live `/lab/` page. Both runs passed:

- five seeded fields and exactly three intended findings;
- offline scan after the page had loaded;
- one-field review, Arrow navigation, current-field highlight, and highlight cleanup;
- explicit read-aloud invocation;
- password-page pause and exclusion after explicit enable;
- empty-state recovery;
- required blank native-validation alert and valid-value recovery;
- no editing or submission;
- free core review and cached Guard+ flagged-first ordering;
- no form/password value in extension storage;
- no review request to another origin;
- no console/page errors in the review flow;
- 0 axe violation groups and 0 serious/critical findings in the populated popup state.

Boundary unit evidence covers conservative swaps, ordinary `from`, Unicode repeated words, retyped-value mismatch, malformed populated fields, required blanks, optional blanks, and clean forms.

## Privacy and network evidence

- A fresh anonymous home → demo session made same-origin requests only.
- Demo local/session storage remained empty after edit, navigation, and reset.
- Packaged extension review made no HTTP(S) request outside the tested site and persisted no sampled field or password values.
- Source inspection found no analytics, tracking, runtime CDN, cloud spell checking, Azure/OpenAI call, or form-value persistence. Runtime fonts and scripts are self-hosted.
- The only external runtime path is optional Sociobot checkout/license verification. Core review stays operational while it is unavailable.
- A returned `?license=verification-6-token` was saved under the documented namespaced key and stripped from the URL. The UI then reported: **“License verification is unavailable. Check your connection and try again.”** Blank restore input reported **“Paste a license token first.”** and returned focus to the field.

The 503 response omits CORS headers. Consequently, attempted live license verification logs a browser CORS error and `net::ERR_FAILED`, although the product catches the failure and leaves free review available.

## Billing and request allowance

Fresh production evidence at approximately 02:47–02:54 UTC:

- `GET /api/v1/products`: **503**, no `Retry-After`.
- `GET /api/v1/products/dyslexia-form-guard/checkout`: **503**, no redirect.
- `GET /api/v1/products/dyslexia-form-guard/verify?license=...`: **503**, no CORS allowance and no `Retry-After`.
- Forty consecutive verification requests all returned **503**; none returned 429.

Therefore no request allowance could be freshly observed. The required “past the allowance → 429 with `Retry-After`” behavior is unverified because the endpoint never reached an application response. Verification 5 previously observed 30 requests per window, but that older result is not substituted for this required fresh test.

## Deployment parity, routing, and headers

The worktree began clean at the requested SHA. Live bytes exactly match the current production build for all HTML routes, JS, CSS, fonts, hero/social images, icons, `robots.txt`, and `sitemap.xml`. The live and local ZIP containers differ only in archive timestamps from rebuilding; both are 74,203 bytes, recursive unpacked comparison has no differences, and both manifest hashes are `0d5f3af7bc8e424f34907a0545e2569a52087aa03948347705c28186cebbd235`.

- Download: 200 `application/zip`; archive valid; MV3 version `1.0.4`.
- Unknown route: 404 with the designed 3,084-byte page.
- HTML caching: `public, must-revalidate, max-age=30`.
- Hashed JS/CSS caching: `public, max-age=31536000, immutable`.
- ZIP caching: `public, max-age=3600`.
- Headers include restrictive CSP, HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, COOP `same-origin`, and a camera/microphone/geolocation-denying Permissions Policy.
- All same-origin navigation/download links returned 200; GitHub source/issues returned 200. The only dead product link is the external Guard+ checkout at 503.

## Accessibility, responsive behavior, and performance

- Local and live route suites: `/`, `/privacy/`, `/terms/`, `/lab/`, and `/404.html` at desktop and 390 px; **0 axe groups and 0 serious/critical findings** on every route.
- `verify-url.sh`: 200 in 703 ms, `lang=en`, title, one h1, main landmark, complete image alt text, no unlabeled buttons, and no console errors on anonymous load.
- Mobile: no horizontal overflow and no visible interactive target below 44 × 44 CSS px.
- Keyboard: first Tab reaches the visible skip link with a 3 px cyan outline and 4 px offset; demo and extension controls are operable without a pointer.
- All demo controls have associated labels; heading order on the demo is h1 → h2.
- Reduced motion hides the hero scan line and collapses animation/transition duration.
- Simulated 200% root text size reflowed without horizontal overflow on home, demo, privacy, or terms.
- Lighthouse 12.8.2 simulated mobile: **99 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.2 s, LCP 1.3 s, TBT 100 ms, CLS 0, total transfer 89 KiB. Navigation-only audit did not produce a field INP sample.
- Budgets pass: JS 8,998 B raw; CSS 15,949 B raw; fonts 56,492 B; mobile hero AVIF 20,892 B; unpacked extension 92,683 B.

## Defects by severity

### High — Guard+ checkout and verification are unavailable

The public catalog, hosted-checkout entry point, and verification endpoint consistently return 503. The declared checkout claim fails, the advertised $12 purchase cannot start, existing buyers cannot freshly verify/restore, and attempted verification produces browser console errors because the 503 has no CORS header. This is release-blocking under the mandatory claims rule even though free local review continues to work.

### High — required unlock API rate-limit contract cannot be verified

Forty consecutive requests returned 503 rather than normal responses followed by 429. No allowance or `Retry-After` could be observed. This may be entirely caused by the same upstream outage, but the release contract requires fresh evidence of enforcement.

## Not applicable

This is a browser extension with a static marketing/download site, not a library, CLI, PWA, authenticated product, or first-party application backend. Package-consumer installation, CLI exercise, PWA service-worker update/offline reload, Entra sign-in, and application-server concurrency/persistence/health checks do not apply. The factory's billing endpoint was tested as required and is the release blocker above.
