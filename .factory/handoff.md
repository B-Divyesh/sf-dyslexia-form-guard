# Form Guard handoff — independent verification 2

**Status: FAIL**
**Verified candidate:** `8c32e43ac7cde5e391141adf1704bbc51772aca8`
**Verified URL:** <https://dyslexia-form-guard.sociobot.in>
**Date:** 2026-08-28

## Result

The candidate builds and its unpacked Chrome MV3 extension successfully performs the seeded local review flow. The live site is nevertheless **not releasable**: its primary extension archive URL, `/downloads/form-guard-chrome.zip`, returns HTTP 404, so users cannot install Form Guard.

## Verification completed

```sh
npm ci
npm run check
npm run build
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
```

- `npm run check` passed: type checking, **10/10** unit tests, production build, and release-artifact assertions.
- The local `dist/site/downloads/form-guard-chrome.zip` is a valid 73,882-byte ZIP (`unzip -t` passed); the unpacked extension is 91.85 KB.
- Real Chromium MV3 test passed the seeded 5-field / 3-check flow, offline-after-load review, ArrowRight navigation, page highlight cleanup, empty state, password pause/exclusion, and no form-value persistence. Popup axe had 0 serious/critical findings and no console/page errors.
- Local and live site axe suites passed all four routes with 0 serious/critical findings. Live desktop and 390 px checks passed focus, no-overflow, reduced-motion, and console/error smoke checks. Live policy headers and immutable asset caching are present; no token-less homepage outbound requests were observed.
- Live homepage and JS bytes match the candidate build, but the live ZIP endpoint is **404**. Full evidence is in `.factory/verification-2.md`.

## Release-blocking defects

1. **Critical:** deploy the archive under `dist/site/downloads/form-guard-chrome.zip`; production currently returns 404.
2. **High:** default sensitive-domain policy misses known banking/health hostnames (`chase.com`, `mychart.com`), contrary to the brief's default-disable requirement.
3. **Medium:** blank required fields are reported as `NO ALERTS` because invalid-field analysis ignores blank values.

## Next steps

Deploy the complete `dist/site/` artifact, expand the sensitive-domain protection, alert on invalid required blanks, add regression coverage, then request a new independent verification.
