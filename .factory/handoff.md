# Form Guard handoff — repair 2 complete

**Status:** PASS

**Work order:** `dyslexia-form-guard-repair-2`
**Failed candidate repaired:** `8c32e43ac7cde5e391141adf1704bbc51772aca8`
**Repair commit:** `e8af55c4ee87d1a3e0ace6b8031e6fbcc40097c3`
**Release:** MV3 extension `1.0.2`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>
**Static deployment:** Azure Static Web Apps `0cb37887-fb3b-4c2a-bd11-062927d4a5ed`, 2026-08-28

## Repairs

1. **Install artifact deployment:** `npm run build:site` now builds the landing site, MV3 extension, and `dist/site/downloads/form-guard-chrome.zip`. This is the work-order deployment command, so it can no longer publish a landing site without its extension download. `npm run build` remains the clean full build. The release assertion now validates ZIP integrity, MV3 manifest, and manifest/package version parity.
2. **Protected domains:** the policy uses exact hostname-label and curated protected-suffix matching instead of a loose substring heuristic. It pauses known banking and health providers including `chase.com`, `secure.chase.com`, `mychart.com`, and `portal.mychart.com`, while retaining the government, password-page, and ordinary-site paths.
3. **Required blanks:** invalid required controls now create the native-validation finding even when their value is blank; optional blank controls remain quiet.
4. **Update delivery:** the extension and package version are `1.0.2`, and the downloadable ZIP embeds the same current MV3 manifest version.

## Exact regression coverage

- `src/lib/domain-policy.test.ts` covers `chase.com` and `mychart.com` plus subdomains and a non-protected `riverbank.example` control case.
- `src/lib/analyzer.test.ts` covers an invalid required blank, an invalid populated value, and an invalid optional blank in one exact native-validation regression.
- `scripts/verify-release.mjs` runs `unzip -t`, reads the consumer `manifest.json`, checks its `manifest_version` and current version, and asserts the deployed static-host fallback/cache/privacy configuration.

## Verification evidence

```sh
npm ci
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
/opt/fleet/lib/deploy-static.sh dyslexia-form-guard dist/site
```

- Clean `npm ci` completed with **0 vulnerabilities**. `npm run check` passed strict TypeScript, **11/11** Vitest tests, clean build, packaging, and release-artifact checks.
- Consumer package: `npm run build:site` created the ZIP directly; `unzip -t` passed locally and from production. The archive has MV3 manifest `1.0.2` and production bytes exactly match local build: SHA-256 `9c6343499218efd0e6525f8e617342f8a5500ba878a62dfa08e4268cc510fb29` (74,040 bytes).
- Production archive: `GET /downloads/form-guard-chrome.zip` is **200 `application/zip`**, with `Cache-Control: public, max-age=3600`. Home/assets return `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Content-Type-Options: nosniff`, and immutable one-year asset caching.
- Real Chromium MV3 smoke: the built extension scanned the local seeded form while offline after load, returned **5 fields / 3 checks**, accepted ArrowRight review navigation, cleared the page highlight on finish, generated no console errors, and did not persist `Sam Rivera` or the textarea value. A real added blank required field returned **4 checks** and displayed its validation alert.
- Accessibility/browser: local and live axe suites passed `/`, `/privacy/`, `/terms/`, and `/lab/` with **0 serious/critical** groups. `verify-url.sh` passed live: title, `lang=en`, one h1, main landmark, image alt coverage, and no console/page errors. At 1440 px and 390 px, live browser checks found no overflow; the first Tab reaches the 3px cyan Skip link focus state and reduced motion hides the scan line.
- Privacy/offline: a free live homepage load made requests only to `dyslexia-form-guard.sociobot.in`; no analytics/CDN requests were observed. The core extension scan worked offline after the page was loaded, and sampled form values remained out of extension storage.
- Performance: production build size is 3.37 KB JS, 13.50 KB CSS, 56.5 KB self-hosted fonts, and 92.19 KB unpacked extension. Lighthouse mobile report recorded **100 performance / 100 accessibility**, LCP **1.2 s**, CLS **0**, TBT **0 ms**. Chromium crashed afterward during Lighthouse's screenshot/BFCache collection, but the JSON report was written; direct Playwright, axe, and verifier checks above passed independently.

## Run and deploy

```sh
npm ci
npm run check
npm run build:site
/opt/fleet/lib/deploy-static.sh dyslexia-form-guard dist/site
```

Deploy the complete `dist/site/` directory. It must include `downloads/form-guard-chrome.zip` and `staticwebapp.config.json`.

## Known gaps / next steps

None. The only external request remains optional Sociobot license verification for a supplied Guard+ token; free review remains local and usable offline after page load.
