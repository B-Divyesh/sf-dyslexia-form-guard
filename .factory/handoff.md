# Form Guard v1 handoff

## Shipped

- A production WXT/TypeScript Manifest V3 extension for Chrome and Edge.
- User-initiated, in-memory inspection of visible text inputs, textareas, and selects.
- Conservative local checks for repeated adjacent words, adjacent letter transpositions, mismatched confirmation fields, and native browser validation errors.
- One-field-at-a-time review with original field labels and values, page-side highlighting, previous/next controls, left/right arrow keys, and user-triggered browser text-to-speech.
- Empty, loading, error, offline, clean-field, and flagged-field states.
- Password values are always skipped. Pages with a password field and banking, health, or government domains pause by default; a user can explicitly allow only that origin.
- No form values are persisted or logged. Stored extension data is limited to allowed origins, a Guard+ preference, and optional license verification state.
- Optional $12 one-time Guard+ unlock through the Sociobot billing API. It adds flagged-first ordering only; core review, accessibility, and safety remain free. Both the site and extension support license restore/paste and cached daily verification without blocking the free experience.
- A responsive static product site, plain-language `/privacy/` and `/terms/` pages, and a `/lab/` seeded practice form with three intentional alerts.
- An original pixel/demoscene hero image generated for this product, reviewed, recorded with prompt/model provenance, and shipped as responsive AVIF/WebP variants from 21–65 KB.
- A downloadable extension archive at `dist/site/downloads/form-guard-chrome.zip`.

## Run and verify

```sh
npm ci
npm run check
npm run build
```

Exact factory build command: `npm run build`.

Static deploy root: `dist/site/` (with `index.html` at that root).

Unpacked extension: `dist/extension/chrome-mv3/`.

Packaged extension: `dist/site/downloads/form-guard-chrome.zip`.

Browser accessibility check:

```sh
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
```

## Verification completed on 2026-08-27

- `npx tsc --noEmit`: passed.
- `npm test`: 8/8 tests passed across 2 files.
- `npm run build`: passed; site, MV3 extension, and ZIP produced.
- `npm audit`: 0 vulnerabilities after updating WXT and Sharp.
- Factory `verify-url.sh`: HTTP 200, no console errors, title present, `lang="en"`, exactly one `h1`, main landmark present, 0 images missing alt, and 0 unlabelled buttons.
- Playwright + axe at 390×844: 0 violations on `/`, `/privacy/`, `/terms/`, and `/lab/`.
- Playwright + axe on the extension’s populated review state: 0 violations.
- Real unpacked-extension Playwright smoke test against `/lab/`: found 5 visible fields, exactly 3 intended checks, opened on “Full name,” highlighted exactly one page field, and logged no console errors.
- Mocked Playwright billing-return smoke test: stored the returned token under `sb_license:dyslexia-form-guard`, removed it from the URL, made exactly one verification request, and rendered the active-license state.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, CLS 0, total blocking time 0 ms. INP was not measured because the lab run had no user interaction; shipped JavaScript is 3.4 KB for the site and 18 KB total for popup plus content script, so it remains well below the 200 KB budget.
- Site CSS: 13.5 KB; extension popup CSS: 7.0 KB. Self-hosted fonts total 56.5 KB. Mobile hero AVIF: 20.9 KB. All are below the specified budgets.
- Desktop and 390 px screenshots were visually inspected; content remains readable, stacked by intent, and free of horizontal overflow.

## Known gaps and next steps

- Cross-origin embedded iframes are not scanned; the user must open an embedded form directly. This avoids silently widening the first release’s reading scope.
- The adjacent-transposition checker intentionally uses a small form-focused vocabulary to limit false alerts. Expand only with measured seeded cases and false-positive tests.
- Browser store signing/publishing, production deployment, DNS, and Sociobot product registration are factory responsibilities and were not performed from this repository. Until registration, the slug-based checkout may not resolve.
- Text-to-speech voices and pronunciation depend on the browser/operating system. The visual review remains fully usable without speech.
- Automated tests exercise Chromium MV3. Firefox packaging is not included in this v1 work order.
