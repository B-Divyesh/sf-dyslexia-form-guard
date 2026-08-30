# Independent verification 8 — FAIL

**Date:** 2026-08-30
**Work order:** `dyslexia-form-guard-verify-8`
**Candidate:** `72ce654c65957305f6905299d2f470ea230cc90f`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>
**Artifact:** Chrome/Edge Manifest V3 extension `1.0.5` plus static site

## Verdict

**FAIL — release-blocking external checkout instability.** The product code, MV3 package, sample demo, privacy behavior, accessibility, and deployed artifact meet the contract in this verification. However, the mandatory `guard-plus-checkout` claim failed from the clean candidate during this run: the public Sociobot product catalog returned `500 {"error":"Internal server error","status":500}` rather than the required 200. Two direct retry requests and the checkout endpoint also returned 500 during the same minute. The claim and five later catalog probes recovered and passed, but the claims contract says **any failing claim test is release-blocking**. A $12 one-time purchase cannot be accepted while its required public billing path is intermittently unavailable.

No product code was modified during verification.

## First-read and demo gate — PASS

A cold production visit at 1440 × 900 plainly states:

- **What:** “Check important forms before you submit.”
- **For whom:** dyslexic people catching repeated words, swapped letters, and mismatched retyped values without sharing form data.
- **What to click first:** the visible one-click **Try it with sample data** action, beside the real download action.

`/lab/` immediately opens a local review on **Delivery notes** with **3 CHECKS** and repeated-word plus adjacent-letter-swap details. Its persistent banner says **Demo — sample data, nothing is saved**, and offers **Reset demo** and **Start for real**. At 390 × 844, reset restored the sample, submit remained disabled, and local/session storage were empty.

## Mandatory claims — 18 PASS, 1 intermittent FAIL

`.factory/claims.json` exists and declares 19 claims. From a clean `npm ci`, every listed claim command was run through the product's packaged extension or loopback demo entry point. The command sequence reached the checkout claim only after the preceding 18 commands passed.

| Claims | Result | Evidence |
| --- | --- | --- |
| `seeded-checks`, `false-alert-limit`, `sensitive-domain-pause` | PASS | Analyzer/domain-policy fixtures produced the three intended checks, no ordinary “from” alert, and paused sensitive hosts. |
| `origin-scoped-permission`, `editable-control-review`, `offline-local-review`, `core-review-free`, `password-exclusion`, `privacy-local-only`, `read-aloud`, `field-highlight`, `keyboard-review-navigation`, `never-edits-or-submits`, `native-validation-alerts`, `guard-plus-flagged-first` | PASS | Fresh Chromium profiles loaded the real packaged MV3 extension; the complete popup flow passed offline review, exact-origin permission, choice/contenteditable state, keyboard, speech, no-edit/no-submit, storage/request privacy, recovery, and paid ordering. |
| `installable-mv3` | PASS | Production build, ZIP integrity, MV3 manifest, response policy, 404, and deploy metadata passed. |
| `sample-demo-review`, `sample-demo-reset` | PASS | Desktop and 390 px demo checks passed; reset was re-run explicitly and passed. |
| `guard-plus-checkout` | **FAIL, then recovered** | First clean command failed because `GET https://api.sociobot.in/api/v1/products` returned 500; two curl retries and checkout also returned 500. A later exact rerun passed and five subsequent catalog probes returned 200. |

The final successful retry does not erase the earlier fresh failure under the stated release rule. This is an operational/dependency finding, not evidence of a product-code regression.

## Clean install, build, and automated checks

```text
npm ci                         PASS — 387 packages; audit 0 vulnerabilities
npm run check                  PASS — typecheck, zero-warning lint, 14/14 unit tests, production build, release verification
npm run test:a11y              PASS — routes at desktop and 390 px; zero axe groups
npm run test:popup-a11y        PASS — real packaged extension; zero serious/critical axe findings
npm audit --omit=dev           PASS — 0 vulnerabilities
npm run claim -- sample-demo-reset       PASS
npm run claim -- guard-plus-checkout     FAIL at 04:43 UTC; PASS on later retry
```

Exact production build output: initial site JS is 8,998 B raw / 3,839 B gzip; CSS 15,949 B raw / 4,304 B gzip; self-hosted fonts total 56,496 B; mobile hero AVIF is 20,892 B; unpacked extension is 93.54 kB. These are within the stated static-product budgets.

## End-to-end, privacy, accessibility, and performance — PASS

- The actual packaged extension was exercised in fresh Chromium profiles. It identified seeded repeated-word, adjacent-swap, and retyped-value issues; maintained zero alerts for the clean `from` fixture; paused sensitive/password pages; worked offline after the page load; and excluded password sentinel values. It never edited an input or fired the form submit listener.
- The packaged-flow request log contained no HTTP(S) request to another origin during review. Extension storage contained no sample or password sentinel. The anonymous live landing/demo flow requested only `dyslexia-form-guard.sociobot.in`; it used no analytics, CDN, AI service, or third-party fonts.
- Live `/`, `/privacy/`, `/terms/`, `/lab/`, and `/404.html` at 1440 × 900 and 390 × 844 had one `<h1>`, one `<main>`, no console/page errors, no horizontal overflow, and zero axe violations (including zero serious/critical). First Tab focused the skip link with a visible `rgb(101, 217, 232)` 3 px outline. Reduced motion hid the scan line and reduced transition durations to `0.00001s`.
- Fresh Lighthouse mobile output was 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO, with FCP 1.1 s, LCP 1.2 s, CLS 0, and 89 KiB total transfer. (Chrome emitted a shutdown tab-crash warning after writing the complete report.)

## Deployment identity, headers, caching, and rate limit — PASS

The live deployment is the candidate artifact:

| File | SHA-256 (live = local) |
| --- | --- |
| Home HTML | `df9309d87567a8423f475b6e1d4b0d491443e4e8515638abad74d8e87dc7531b` |
| Main JS | `311e97aa453585692e98c79439bd4b34b6990e4893d1f2b68c0b8a17d4c5acf9` |
| Main CSS | `ab35ab068a7ef69da6de0331699d6de1d73e621a722fb3ca88ef8b7423d87ed5` |

The live and local ZIPs both unpack to identical extension files and `manifest.json` version `1.0.5` (archive containers may differ by timestamp). Production sends HSTS, `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP, restrictive CSP including `frame-ancestors 'none'`, and a camera/microphone/geolocation-denying Permissions Policy. HTML uses 30-second revalidation; hashed assets use one-year immutable caching; ZIPs use one hour. A designed unknown route returns HTTP 404.

For the documented product-unlock endpoint, a fresh 40-request single-client burst to invalid-license verification returned **30 × 200**, then **10 × 429**. Every 429 included `Retry-After: 4` and `X-RateLimit-After: 4`. Observed allowance: 30 requests per roughly five-second window per client.

## Defects by severity

### High — Guard+ checkout claim is intermittently unavailable

At 04:43 UTC, the required public billing catalog returned HTTP 500 for the exact mandatory claim and two direct retries; checkout returned 500 too. It later recovered, but the buyer-facing `$12` hosted checkout promise was unavailable for several consecutive fresh requests. This fails the mandatory claim gate and makes a paid purchase unreliable. Restore and monitor the Sociobot catalog/checkout service, then re-run the claim repeatedly until it is stable before accepting this candidate.

## Not applicable

This static browser-extension product has no sign-in, first-party backend, PWA service worker, CLI, or library consumer API. Entra authentication, backend persistence/concurrency/health, PWA update/offline-reload, and package-consumer checks do not apply. The only server-side dependency in scope, Sociobot billing, was tested above.
