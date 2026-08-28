# Independent verification 1 — FAIL

**Date:** 2026-08-28

**Candidate:** `2562476ecf51cd770d454adc9dd342d523cf961e`

**Production URL:** `https://dyslexia-form-guard.sociobot.in`

## Verdict

**FAIL.** The source candidate builds and the unpacked extension performs the promised local review flow, but the live product's primary install link is not deployed: `GET /downloads/form-guard-chrome.zip` returns the homepage (`200 text/html`, 11,832 bytes), rather than the built ZIP. A visitor cannot download/install the browser extension from the shipped site, so the real job-to-be-done is not available end to end.

The live homepage and its JavaScript/CSS exactly match the candidate's built files, so this is fresh evidence of a deployment artifact/configuration failure, not an older-site mismatch.

## Local clean-checkout evidence

- Started from a clean worktree at the requested SHA; `npm ci` completed with 0 audit vulnerabilities.
- `npm test`: **8/8 passed** (analyzer and domain-policy tests).
- `npx tsc --noEmit`: passed.
- `npm run check`: passed. This runs type check, tests, and the exact production build.
- `npm run build`: passed independently. It produced `dist/site/`, `dist/extension/chrome-mv3/`, and a valid 73,813-byte `dist/site/downloads/form-guard-chrome.zip` (`unzip -t` passed).
- `npm run test:a11y` passed against the served production build at `127.0.0.1:4173`: 0 axe violation groups / 0 serious-or-critical findings on `/`, `/privacy/`, `/terms/`, and `/lab/`. Invoking that command without first serving the site fails with `ERR_CONNECTION_REFUSED`; the README documents the required preview-server prerequisite.

## Extension end-to-end evidence

Fresh Chromium MV3 test loaded `dist/extension/chrome-mv3/` and exercised the actual popup and content script against `/lab/`.

- The seeded normal case showed **5 fields** and **exactly 3 checks**: repeated `the`, `emial` → `email`, and mismatched Email/Confirm email.
- Keyboard ArrowRight advanced field review; the current page field was highlighted, and **Finish and clear highlight** removed it.
- Empty page showed the retryable no-editable-fields state.
- A page containing password + name fields paused by default. After explicit per-origin enable, it reviewed only the name (`FIELD 01 / 01`, value `Sam`), never `topsecret`.
- An invalid email value (`wrong`) produced the browser-native validation warning and did not crash.
- Popup axe scan in populated review state: 0 serious/critical findings. No console/page errors occurred in the product flow.
- Extension `storage.local` after these cases contained only `allowedSites: ["http://127.0.0.1"]`; it contained none of the sampled form values, password, or invalid email.

## Live site, privacy, accessibility, and performance evidence

- Homepage HTML SHA-256: `89892f49e24532d31e01a075fa2ed372f3cf3977722cbb564e6446962d3e71a3` for both live and `dist/site/index.html`.
- Live `main-q865iiQS.js` and `main-DsZULG6H.css` SHA-256 values match the candidate build.
- Desktop (1440 px) and mobile (390 px) Playwright checks: title present, `lang="en"`, exactly one `h1`, `main`, all images have `alt`, no horizontal overflow, visible cyan 3 px keyboard focus on the skip link, and no console/page errors.
- Axe on the live home at both viewports: 0 serious/critical findings. The supplied route suite above also passed at 390 px.
- Reduced motion hides the scan line (`display: none`). Empty license submission gives the recoverable “Paste a license token first.” state. A mocked license return stored the token, removed it from the URL, and showed active state.
- Free homepage load made no third-party/outbound requests. Static inspection found no analytics, CDN font/script, cloud text analysis, or form-value persistence. The only network API in source is optional Sociobot license verification; core review is local.
- Production assets are within budget: site JS 3.37 KB, site CSS 13.50 KB, site fonts 56.5 KB total, mobile hero AVIF 20.9 KB; extension popup + content JS 17.5 KB and complete extension 91.7 KB. A Lighthouse CLI run could not complete in this container because Chromium crashed; direct browser/accessibility and byte-budget checks above completed.

## Defects

### Critical — live install artifact missing

`https://dyslexia-form-guard.sociobot.in/downloads/form-guard-chrome.zip` returns `HTTP 200`, `Content-Type: text/html`, 11,832 bytes, and the same SHA-256 as live `index.html`, rather than the valid ZIP made by `npm run build`. All three Download/Get extension links point here. This blocks installation and therefore the extension's real form-review workflow.

### Medium — textarea label is polluted by its value

On the shipped `/lab/` form, the one-field review heading for the textarea is `Delivery notesSend the the receipt to my emial address.` rather than `Delivery notes`. The value is also presented separately and included in speech, so this duplicates sensitive content and makes the label/read-aloud less clear. Cause is consistent with reading the enclosing `<label>` element's full `textContent` instead of its label-only text.

### Medium — deployed response policy/cache rules do not match shipped `_headers`

The candidate ships immutable one-year cache rules for `/assets/*` and `/fonts/*`, plus `Referrer-Policy: no-referrer` and a restrictive `Permissions-Policy`. The live host returns `Cache-Control: public, must-revalidate, max-age=30`, `Referrer-Policy: strict-origin-when-cross-origin`, and no `Permissions-Policy` for home, JS, CSS, fonts, privacy, terms, or lab. HSTS and `X-Content-Type-Options: nosniff` are present. This is a deployment configuration discrepancy and misses the stated caching/privacy response policy.

## Required next steps

1. Deploy the complete `dist/site/` output, including `downloads/form-guard-chrome.zip`; verify it returns `application/zip` (or `application/octet-stream`) and the built archive bytes.
2. Apply the shipped `_headers` policy at the static host, or document/implement equivalent cache and browser policies.
3. Correct label extraction for controls nested in `<label>` so a textarea/input value cannot become part of its displayed/spoken label; add regression coverage.
4. Re-run this verification against the updated candidate and live URL.
