# Independent verification 2 — FAIL

**Date:** 2026-08-28
**Candidate:** `8c32e43ac7cde5e391141adf1704bbc51772aca8`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>

## Verdict

**FAIL.** The candidate source, built MV3 extension, accessibility checks, and most of the live landing site work. However, the live site does not deploy the candidate's required extension archive: every installation link targets `/downloads/form-guard-chrome.zip`, which returns **HTTP 404**. That prevents a user from installing the product and completing the actual job-to-be-done. The release also has two source-level contract gaps: incomplete required fields are actively reported as having no alert, and the protected-domain heuristic does not pause known banking/health domains such as `chase.com` and `mychart.com`.

## Clean-checkout and artifact evidence

- Worktree was clean and at the requested SHA before testing. `npm ci` completed (0 audited vulnerabilities).
- `npm run check` passed: strict `tsc --noEmit`, **10/10** Vitest tests, exact `npm run build`, and release-artifact assertions. `npm run build` was run again independently and produced `dist/site/` and `dist/extension/chrome-mv3/`.
- The consumer install artifact exists locally at `dist/site/downloads/form-guard-chrome.zip` (73,882 bytes); `unzip -t` passed and its archive contains the MV3 manifest, popup, content script, fonts, icons, and assets.
- Build budgets pass: site JS 3.37 KB raw / 1.58 KB gzip, CSS 13.50 KB raw / 3.83 KB gzip, self-hosted fonts 56.5 KB total, mobile AVIF 20.9 KB, and complete unpacked extension 91.85 KB.

## Browser and product-flow evidence

Fresh Chromium loaded the built unpacked MV3 extension, exercised its actual popup/content-script messaging, and captured no page or console errors.

- Seeded `/lab/` normal case: **5 fields** and exactly **3 checks** (repeated `the`, `emial` → `email`, and Email/Confirm email mismatch).
- The initial scan also completed while the browser was offline after the page had loaded, confirming the free core review does not need a service request.
- Keyboard ArrowRight advanced the active field. The page received the 4 px amber highlight; **Finish and clear highlight** removed it.
- The nested textarea has the repaired label `Delivery notes` and separately shows `Send the the receipt to my emial address.`.
- No-editable-fields state is retryable. A page containing Name plus Password paused before scan; after an explicit per-origin enable it showed only `Sam`, never `topsecret`.
- Popup axe in populated review state: **0 serious/critical**. Extension storage after the test contained only `allowedSites: ["http://127.0.0.1"]`; none of the form values or password were persisted.
- Boundary failure: a native `<input required value="">` is shown as **`NO ALERTS`**, even though `validity.valid` is false and the browser has a native “Please fill out this field” validation message.

## Live deployment, privacy, accessibility, and response evidence

- Live `index.html` SHA-256 equals candidate output: `89892f49e24532d31e01a075fa2ed372f3cf3977722cbb564e6446962d3e71a3`. The live `main-q865iiQS.js` SHA-256 also exactly equals the build: `a12c7358bc152351cd03a5cec9628aa6ea214787a96703b81caa6182f7e32c2c`.
- In contrast, `GET https://dyslexia-form-guard.sociobot.in/downloads/form-guard-chrome.zip` returned **404 `text/html`**. The local candidate archive is valid, so the live deployment is incomplete rather than an old-site mismatch.
- Current live headers are otherwise good: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and one-year immutable cache for `/assets/*`. The missing archive has no usable download/cache response because it is 404.
- `FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y` passed all four published routes (`/`, `/privacy/`, `/terms/`, `/lab/`) with **0 serious/critical** axe groups. The same suite passed against local production output.
- Desktop 1440 px and mobile 390 px live checks found one title, `lang="en"`, one h1, a main landmark, no horizontal overflow, no console/page errors, and a designed 3 px focus outline on the first-tab skip link. With reduced motion the scan line is hidden. Blank license submission gives the recoverable “Paste a license token first.” message.
- A token-less landing-page load made no outbound/third-party requests; static review found no analytics/CDN/font fetches and no form-value storage. The only product fetches are optional Sociobot license verification calls. Lighthouse emitted a report of **99 performance / 100 accessibility**, LCP **1.2 s**, CLS **0**, TBT **100 ms**; Chrome then crashed during its post-audit screenshot/BFCache collection, so the direct Playwright and axe results above are the authoritative browser evidence.

## Defects

### Critical — live install artifact is absent

All Download/Get extension controls target `/downloads/form-guard-chrome.zip`, but production returns HTTP 404. A valid 73,882-byte archive is built locally. This blocks extension installation and therefore makes the product unavailable end to end.

### High — sensitive-domain default pause does not cover known protected domains

`sensitiveDomainReason()` only matches a short hostname substring list. Direct execution returns `null` for `chase.com` and `mychart.com`, while returning expected values for `bankofamerica.com` and `irs.gov`. On an editable non-password page at either missed domain, the extension does not pause by default. This violates the brief's explicit default-disable constraint for banking and health domains.

### Medium — blank required fields receive a misleading clear result

`analyseFields()` adds native-validation findings only when `!field.valid && field.value.trim()`. Required blank values therefore produce “No alert for this field,” contrary to the README promise to report native field/value problems and unsafe for high-stakes completion.

## Required next steps

1. Deploy the complete `dist/site/` directory, including `downloads/form-guard-chrome.zip`, and verify production responds 200 with ZIP bytes before re-verification.
2. Replace the hostname substring heuristic with a conservative protected-domain mechanism that covers banking and health sites (or pause unknown sites by default and make the opt-in explicit); add regression cases for `chase.com` and `mychart.com`.
3. Alert on invalid required blank controls, while retaining quiet treatment for optional blank controls; add a regression test.
4. Re-run independent verification against the updated commit and live URL.
