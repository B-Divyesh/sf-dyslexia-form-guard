# Form Guard handoff — repair complete

**Repair work order:** `dyslexia-form-guard-repair-1`
**Base examined:** `5005af3e570e80e340231739ae6ab775191b148d` (failed verification of candidate `2562476ecf51cd770d454adc9dd342d523cf961e`)
**Release:** extension and consumer archive `1.0.1`
**Live URL:** <https://dyslexia-form-guard.sociobot.in>
**Deployed:** 2026-08-28; Azure Static Web Apps deployment `67915249-2a97-4d2b-8d2b-f600ebc6b4e0`

## Status

**PASS — all three independent-verifier release blockers are repaired and re-verified in production.** The artifact remains an MV3 WXT TypeScript browser extension with a static Vite landing site; no product scope, storage policy, or paid-feature boundary changed.

## Repairs

1. **Install archive and static-host fallback:** `public/staticwebapp.config.json` is now shipped with the static output. It excludes `/downloads/*` from SPA fallback, so a missing archive can never be silently rewritten to `index.html`; it applies the intended cache, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `nosniff` policies on Azure Static Web Apps.
2. **Nested-label privacy/clarity:** `labelText()` clones a native label and removes embedded controls before reading its text. A textarea value is therefore only the value, never part of the displayed or spoken label.
3. **Regression and release coverage:** the nested-textarea case has an exact JSDOM unit test. `npm run test:release`, included in `npm run check`, asserts the built archive begins with ZIP bytes and the built Azure configuration keeps the download exclusion, privacy policy, and cache rules. The extension/package version is `1.0.1` so browsers can accept this repair as an update.

## Verification evidence

- Clean install: `npm ci` completed with **0 vulnerabilities**.
- Type/unit/build/release gate: `npm run check` passed: TypeScript strict check, **10/10** Vitest tests, site build, MV3 extension build, archive packaging, and release-artifact assertion.
- Consumer archive: `unzip -t dist/site/downloads/form-guard-chrome.zip` passed. Its `manifest.json` is `1.0.1`.
- Live archive: `GET /downloads/form-guard-chrome.zip` is **200 `application/zip`**, 73,882 bytes; SHA-256 is `0c78d1b79c2b6530072545f93b10a2a0faf5b7ff739caf1ac6e6a740aeb19425` for both the build and downloaded production file. The live archive passed `unzip -t` and exposes manifest `1.0.1`.
- Live response policy: home returns `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `X-Content-Type-Options: nosniff`; JS returns `Cache-Control: public, max-age=31536000, immutable`; the archive returns `Cache-Control: public, max-age=3600`.
- Real extension/browser flow: a fresh Chromium MV3 load against live `/lab/` scanned the form, navigated by ArrowRight to the textarea, and rendered label **`Delivery notes`** with value **`Send the the receipt to my emial address.`** separately; no browser errors. The same loaded extension scanned the seeded local lab page while offline and returned **`3 CHECKS`** with no errors.
- Browser/accessibility: `FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y` passed all four routes (`/`, `/privacy/`, `/terms/`, `/lab/`) with **0 serious/critical** axe groups. `/opt/fleet/lib/verify-url.sh` passed live with title, `lang=en`, one `h1`, a main landmark, image alt coverage, and no console errors.
- Responsive/keyboard/privacy: Playwright desktop (1440 px) and mobile (390 px) checks found no overflow or console/page errors. The first Tab reaches the Skip to main content link with the cyan 3px focus ring; reduced motion hides the scan line. A free landing-page load requested only `https://dyslexia-form-guard.sociobot.in` (no third-party analytics/CDNs); the local-first review works offline after the page is loaded.
- Lighthouse: live mobile run scored **100 performance / 100 accessibility**. Built site JS is 3.37 KB, CSS 13.50 KB, fonts 56.5 KB total, and the MV3 extension is 91.85 KB.

## Run / deploy

```sh
npm ci
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
```

Deploy the complete `dist/site/` directory through the factory static deployment command. Do not omit `downloads/form-guard-chrome.zip` or `staticwebapp.config.json`.

## Known gaps / next steps

None for this repair. The optional Guard+ license verification remains the only external API call and is intentionally skipped for a free, token-less session; core review, navigation, readout, and safety behavior stay local and usable offline after page load.
