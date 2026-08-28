# Independent verification 3 — FAIL

**Date:** 2026-08-28
**Candidate:** `d0099e2804f4a36ac0519381d4bda0ccdee618ff`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>
**Artifact:** Chrome/Edge MV3 extension `1.0.2`

## Verdict

**FAIL.** The previous missing-download deployment failure is repaired: production serves an installable ZIP whose complete file payload matches the candidate build, and the core extension catches all three seeded errors locally. The release still fails the acceptance contract because the advertised $12 Guard+ checkout returns HTTP 404, the default health-site pause misses the major health domain `cigna.com`, and the active read-aloud Stop control produces an axe serious contrast failure at 1.26:1. Boundary testing also found that repeated words ending in non-ASCII letters are missed.

No product code was changed during this verification.

## Clean checkout and quality gates

- Began with an empty `git status --porcelain` at the exact candidate SHA, also then `origin/main`.
- Node `v22.23.2`, npm `10.9.8`; root Playwright resolved to the required `1.58.2`.
- `npm ci`: passed, 310 packages installed, 0 vulnerabilities. `npm audit --omit=dev`: 0 vulnerabilities.
- `npm test`: **11/11 passed** across analyzer, domain-policy, and field-label suites.
- `npx tsc --noEmit`: passed. There is no lint script in `package.json`.
- `npm run build`: passed using the exact production command and produced `dist/site/`, `dist/extension/chrome-mv3/`, and the download ZIP.
- `npm run test:release` and the aggregate `npm run check`: passed. `unzip -t` reported no errors; embedded manifest is MV3 version `1.0.2`.
- Local and live `npm run test:a11y` passed `/`, `/privacy/`, `/terms/`, and `/lab/` with 0 serious/critical axe groups. This route suite does not exercise the extension popup's speaking state described below.

## Core extension product flow

A fresh Chromium profile loaded the built MV3 extension and exercised real content-script/popup messaging against independent forms.

- Seeded form: **5 fields / 3 checks**, catching the repeated `the`, `emial` → `email`, and Email/Confirm email mismatch: 100% of the three intended errors, with 0 alerts on a separate clean four-field form.
- The scan still completed after Chromium was put offline (`OFFLINE / LOCAL`). During scan the only request was the extension-local WOFF2 font; no form value left the browser.
- One-at-a-time review showed the corrected label `Delivery notes`, displayed its value separately, spoke the label/value/two findings, accepted ArrowRight navigation, applied the 4 px amber field outline, and removed it on Finish.
- An empty/hidden/disabled/read-only-only page showed the retryable empty state; dynamically adding a field and selecting Scan again recovered to `FIELD 01 / 01`.
- A blank required field and populated invalid email each produced the browser validation alert (**2 checks** total); an optional blank remained quiet.
- A browser-internal page produced the actionable restricted-page error; navigating to a normal page and selecting Try again recovered successfully.
- A Name + Password page paused by default. Explicit site enable reviewed only Name (`Sam`), never displayed `topsecret`, and reported `FIELD 01 / 01`.
- Extension storage after all sampled forms contained only `allowedSites: ["http://127.0.0.1"]`; no sampled name, email, notes, invalid value, or password was persisted. No page/console errors occurred.
- Not applicable: this artifact is not a library, CLI, PWA, or backend, so consumer API install, service-worker offline-update, concurrency, persistence, and health/build-identity checks do not apply.

## Live deployment, parity, privacy, and response policy

- `GET /downloads/form-guard-chrome.zip`: **200**, `application/zip`, 74,040 bytes, `Cache-Control: public, max-age=3600`; archive integrity passed.
- Candidate/live hashes match for HTML (`89892f...e71a3`), JS (`a12c73...32c2c`), and CSS (`871ec0...e3e`). The ZIP container hash changes when rebuilt because archive timestamps are nondeterministic, but the entry list and bytes of **every file inside** the live and local ZIP compare equal.
- `/privacy/`, `/terms/`, and `/lab/` return 200; a missing download correctly returns 404 instead of the SPA fallback.
- Home responses include HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Hashed JS/CSS are cached for one year immutable; HTML uses 30-second revalidation.
- An anonymous homepage load requested only `dyslexia-form-guard.sociobot.in`. Static inspection found no analytics, trackers, CDN scripts/fonts, form-value storage, or cloud text analysis. The only runtime external API is optional Sociobot checkout/license verification.
- Invalid-license verification returns the expected `200 {valid:false, reason:"invalid"}` with `Cache-Control: no-store`. A mocked valid return saved the token, stripped it from the page URL, cached the verdict, and showed the active state. Blank restore submission focused the token input and explained what to do.
- Security hardening gap: Lighthouse reports no enforced CSP, no clickjacking control (`frame-ancestors`/XFO), and no COOP. These are defense-in-depth gaps; no injection exploit was found.

## Desktop, mobile, accessibility, and performance

- Live browser checks at 1440×900 and 390×844: 200 response, title, `lang="en"`, exactly one h1 and main, complete image alt coverage, no horizontal overflow, and no console/page errors.
- First Tab at both widths reaches the visible Skip link with a 3 px cyan outline. Reduced motion hides the scan line, switches smooth scrolling to auto, and reduces transitions to effectively instant.
- Live axe at both widths and the four-route suite found 0 serious/critical groups. The populated extension review is also clean until read-aloud enters its active Stop state; that state has the serious contrast defect below.
- Several secondary mobile targets are under the required 44 px dimension: the header home mark is 30×30 and footer links are 32 px high.
- Lighthouse 12.8.2 simulated mobile: **98 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 0.9 s, LCP 1.1 s, TBT 150 ms, CLS 0, total transfer 86 KiB.
- Build budgets pass: site JS 3.37 KB raw / 1.58 KB gzip, CSS 13.50 KB raw / 3.83 KB gzip, fonts 56.5 KB total, mobile hero AVIF 20.9 KB, and complete unpacked extension 92.19 KB.
- `/opt/fleet/lib/verify-url.sh` passed production: load 779 ms, title/lang/main/alt checks good, 0 console errors.

## Defects

### High — advertised Guard+ checkout is unavailable

Fresh `GET https://api.sociobot.in/api/v1/products/dyslexia-form-guard/checkout` returns **HTTP 404** with `{"error":"enabled factory product","status":404}`. The landing page and extension both advertise and link this $12 one-time purchase. Free review works, but the shipped paid flow cannot be completed.

### High — explicit health-domain default pause misses `cigna.com`

The extension paused `chase.com` in a real browser, confirming the new suffix path works, but immediately entered review on the representative major health domain `cigna.com`. The policy only recognizes three health suffixes plus literal hostname labels; `cigna.com` contains none. This contradicts the brief and homepage claim that health domains pause by default and allows visible health-form values to be read without the extra per-site consent gate.

### High — axe serious contrast failure while read-aloud is active

In the populated popup, after Read changes to Stop, axe reports `color-contrast` (serious) on `#speak-button > span`: foreground `#090c14` over hovered background `#19243a`, **1.26:1** versus the required 4.5:1. The hover selector outranks the speaking-state background rule, making the important stop-speech label difficult to see while the pointer remains over the control.

### Medium — Unicode repeated-word boundary is missed

The boundary value `Thé thé address` produced `NO ALERTS`. The repeated-word rule uses JavaScript `\b`, whose word boundary is not Unicode-letter aware at `é`; common repeated words ending in non-ASCII letters are therefore silently missed even though the tokenizer elsewhere uses Unicode properties.

### Medium — mobile secondary touch targets are below 44 px

At 390 px, the header home control is 30×30 and footer links are 32 px high. This misses the supplied 44×44 CSS-pixel target baseline. Primary download and form controls meet the target.

### Low — landing responses lack CSP and framing control

Production has useful HSTS/referrer/permissions/nosniff headers, but no enforced Content-Security-Policy and no `frame-ancestors` or X-Frame-Options. Lighthouse flags both as security hardening opportunities.

## Required next steps

1. Register/enable the production billing product and verify checkout redirects to the hosted checkout instead of returning 404.
2. Implement a defensible protected-site policy that covers representative health/banking providers beyond a tiny hard-coded list; add real cases such as `cigna.com`.
3. Fix speaking + hover color precedence and add an axe test that keeps the popup in the active Stop state.
4. Replace the ASCII word-boundary duplicate rule with Unicode-aware boundaries and add accented-word regression coverage.
5. Increase secondary touch targets to 44 px and add CSP/frame controls, then re-run independent verification against the new candidate and production.
