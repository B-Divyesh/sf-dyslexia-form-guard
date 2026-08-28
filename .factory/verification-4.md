# Independent verification 4 — FAIL

**Date:** 2026-08-28
**Candidate:** `2e216eaf35568adbf135d8ade8ec3e5d29e507f4`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>
**Artifact:** Chrome/Edge MV3 extension `1.0.2`

## Verdict

**FAIL.** The free, local-first Form Guard job-to-be-done is working in the candidate and in the current deployment: a user can download the live MV3 archive, install it, locally review a form one field at a time, and see the three seeded transposition/repetition/retyped-value checks. The earlier deployment artifact and response-policy failures are repaired.

The release nevertheless does not meet the full acceptance contract because its advertised $12 one-time Guard+ purchase cannot be completed. Fresh `GET https://api.sociobot.in/api/v1/products/dyslexia-form-guard/checkout` returns `404 application/json` with `{"error":"enabled factory product","status":404}` rather than redirecting to hosted checkout. The in-product integration is correctly slug-only and the verification endpoint works, but the factory-side product registration/enablement is still absent. No product code was modified during this verification.

## Clean-checkout quality gates

Verification used a new detached worktree at the exact candidate SHA; the original checkout was clean before documentation changes.

```sh
npm ci                 # 310 packages installed; audit: 0 vulnerabilities
npm run check          # PASS: tsc, 12/12 Vitest tests, exact build, release artifact test
npm run test:a11y      # PASS: 4 local routes × desktop and 390 px, axe 0 serious/critical
npm run test:popup-a11y # PASS: actual built MV3 loaded in Chromium, axe 0 serious/critical
```

`npm run build` invokes the production build route (`vite build`, `wxt build`, and extension packaging) and produced `dist/site/`, `dist/extension/chrome-mv3/`, and the distributable ZIP. There is no lint script in `package.json`; strict TypeScript is included in `npm run check`.

The valid local archive passes `unzip -t`, embeds MV3 `1.0.2`, and contains the popup, content script, fonts, icons, and manifest. This is a browser extension, not a library, CLI, PWA, or backend; consumer-install, service-worker update/offline reload, concurrency, persistence-server, and health/build-identity checks are not applicable.

## Independent product-flow evidence

Fresh Chromium profiles loaded `dist/extension/chrome-mv3/`, not a mocked popup.

- The shipped `/lab/` form produced exactly **3 checks** for its intended repeated word, `emial` → `email`, and Email/Confirm email mismatch. This catches 100% of the seeded intended issues, with a clean control receiving no alert.
- Keyboard-only ArrowRight/ArrowLeft changed the current field; the page received the 4 px amber current-field outline; **Finish and clear highlight** removed it.
- Boundary run: clean `amount` stayed quiet; `emial` was flagged as an adjacent transposition; Unicode `Émile Émile` was flagged as a repeated word.
- A blank native `required` field produced the browser validation finding. After entering `A-104`, a rescan gave **NO ALERTS**.
- A page containing `Reference` and a password paused by default. After explicit per-origin enable it reviewed only `Reference` (`FIELD 01 / 01`); the sampled password `TOP-SECRET-998` never appeared.
- A form with no editable controls showed the retryable empty state; adding a control and selecting **Scan again** recovered to review with **NO ALERTS**.
- The built popup also passed the repository's offline case: after the page loaded, Chromium was taken offline; review still found all 3 checks and showed `OFFLINE / LOCAL`.
- During independent scan, the captured HTTP(S) request list was empty. Extension storage after sampled flows contained only allowed-origin state and did not contain `TOP-SECRET-998`, `public value`, or `A-104`. Source and runtime review found no analytics, CDN scripts/fonts, cloud text analysis, or form-value persistence.
- No console errors or `pageerror` events occurred in the independent flow. The separate live-site sweep across `/`, `/privacy/`, `/terms/`, and `/lab/` at desktop and 390 px likewise found none.

Domain-policy unit coverage passes representative government (`forms.gov`), banking (`secure.mybank.example`, `chase.com`), and health (`patient.health.example`, `mychart.com`, `cigna.com`) hosts, plus subdomains. The extension pauses a password-field page before any scan and excludes passwords even after an explicit enable.

## Deployment parity, browser policy, accessibility, and performance

- Live homepage SHA-256 equals the local candidate output: `0a326456ad9284d537385ba648db5979490d84360a66ef64ed10d52c47923af1`.
- Live HTML references the candidate's `main-CrcQ2_aX.js` and `main-BfTaTo_7.css`. The live ZIP container hash differs from the local rebuilt ZIP because its archive metadata differs, but a recursive comparison of every unpacked entry found no content differences; the embedded manifest hash is identical.
- Live `/downloads/form-guard-chrome.zip` is `200 application/zip`, 74,124 bytes, with `Cache-Control: public, max-age=3600`. Hashed JS/CSS return `Cache-Control: public, max-age=31536000, immutable`.
- Live HTML and asset responses provide HSTS, CSP (`default-src 'self'`; only the Sociobot billing API in `connect-src`; `frame-ancestors 'none'`), `X-Frame-Options: DENY`, COOP `same-origin`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a camera/microphone/geolocation-denying Permissions Policy. A missing download is excluded from the SPA fallback by the shipped configuration.
- The supplied Playwright axe suite found **0 serious/critical** groups on all four routes at 1440 × 900 and 390 × 844. It also verified first keyboard focus reaches the skip link, no mobile horizontal overflow, and secondary mobile targets at least 44 px. Popup axe found **0 serious/critical** groups, including the active hovered Stop/read-aloud state.
- Independent 390 px reduced-motion check confirmed `prefers-reduced-motion: reduce`, no horizontal overflow, visible 3 px cyan skip-link focus, hidden scan line, and an effectively instant `0.01ms` animation duration. The 8-route live console/page-error sweep was clean.
- Lighthouse 12.8.2 simulated mobile production result: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP **1.1 s**, LCP **1.4 s**, TBT **0 ms**, CLS **0**.
- Bundle budgets pass: site JS **3,372 B** raw (1,580 B gzip), CSS **13,600 B** raw (3,850 B gzip), self-hosted fonts **56,492 B** total, mobile hero AVIF **20,892 B**, and complete unpacked extension **92,484 B**. These are all below the stated limits.

## Defects by severity

### High — Guard+ checkout is unavailable

The live homepage and popup advertise **Buy Guard+ — $12 once** at the required Sociobot checkout URL, but the factory API returns `404 {"error":"enabled factory product","status":404}`. In contrast, `GET /verify?license=invalid-verification-token` returns `200 {"valid":false,"reason":"invalid","expires_at":null}` with `Cache-Control: no-store`, so this is specifically a missing/disabled product registration rather than a bad client endpoint.

The free core remains usable, but the announced one-time paid unlock cannot be purchased, so the monetization/purchase flow is not end to end. This is an external factory/billing-state defect; it cannot be repaired by changing this repository without that authority.

### Medium / low

None found in the candidate or current deployment during this verification.

## Required next action

Register and enable the `dyslexia-form-guard` $12 one-time product in the Sociobot billing engine, retaining the required slug `dyslexia-form-guard`. Verify that its checkout endpoint redirects to hosted checkout, then rerun the checkout probe and this independent release verification. No code redeploy is indicated by current parity evidence.
