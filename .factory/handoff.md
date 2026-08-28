# Form Guard repair handoff — deployment complete, billing registration blocked

**Work order:** `dyslexia-form-guard-repair-3`  
**Base verifier report:** `4031b3c989456327bc333e00847df3535993ae97`  
**Repair commits:** `e038043` (product fixes), `853ca69` (extension integration regression)  
**Deployment:** <https://dyslexia-form-guard.sociobot.in> (Azure Static Web Apps deployment `727d3618-e609-4078-992b-3757dd90d4ec`)  
**Date:** 2026-08-28

## Result

Five repository-controlled verification findings are repaired and deployed:

1. Protected-domain policy now pauses Cigna and its subdomains, alongside a deliberately conservative set of major health providers. `cigna.com` and `account.cigna.com` have direct unit coverage.
2. Adjacent duplicate detection uses Unicode letter/mark boundaries rather than ASCII `\b`; `Thé thé address` now produces the repeated-word finding.
3. The active read-aloud Stop state retains the cyan surface and dark foreground while hovered. The built popup is scanned by axe in that exact state with zero serious/critical groups.
4. Header home and footer navigation targets are at least 44 × 44 CSS px at 390 px. Browser regression coverage checks those targets, all routes, overflow, keyboard skip focus, and axe at desktop and mobile.
5. The static response policy now enforces a same-origin CSP with only the Sociobot billing API allowed for connects, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy: same-origin`. These are asserted in the release-package test and are live.

The sole remaining release blocker is outside this repository: `GET https://api.sociobot.in/api/v1/products/dyslexia-form-guard/checkout` still returns `404 {"error":"enabled factory product","status":404}`. The public product registry does not contain this slug, while the documented verify endpoint responds correctly. The factory contract explicitly reserves billing registration to the factory; this worker did not alter billing infrastructure. Guard+ remains correctly integrated using the required slug-only Sociobot API, but it cannot be purchased until the factory registers/enables this product.

## Verification evidence

Clean install and package quality:

```sh
npm ci                 # 310 packages; 0 vulnerabilities
npm audit --omit=dev   # 0 vulnerabilities
npm run check          # passed: TypeScript, 12/12 unit tests, clean build, MV3 ZIP package/release policy checks
```

Browser and extension checks:

```sh
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:popup-a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:popup-a11y
```

- All four site routes passed axe with **0 serious/critical** groups at 1440 × 900 and 390 × 844; keyboard first focus, no horizontal overflow, and 44 px secondary targets passed.
- The built MV3 extension loaded against the seeded `/lab/` form, was put offline after page load, found all **3 expected checks**, showed `OFFLINE / LOCAL`, and passed axe with **0 serious/critical** groups in the hovered Stop state.
- `/opt/fleet/lib/verify-url.sh` against production passed: 200, 802 ms load, title/lang, one h1/main, complete image alt text, and no console errors.
- Live response headers include the deployed CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP `same-origin`, referrer policy, permissions policy, nosniff, and HSTS.
- Lighthouse 12.8.2 simulated mobile production result: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; LCP 1.2 s, TBT 0 ms, CLS 0, 87 KiB transfer.
- Build remains well within the static budget: site JS 3.37 KB raw, CSS 13.60 KB raw, local fonts 56.5 KB, and unpacked extension 92.48 KB.

## How to run

```sh
npm ci
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:popup-a11y
```

`test:popup-a11y` requires `xvfb-run` because it loads the real MV3 extension in Chromium. It tests the extension package, not a mocked popup.

## Next required factory action

Register/enable the `dyslexia-form-guard` $12 one-time product in the Sociobot billing engine, then confirm its checkout endpoint redirects to hosted checkout. Re-run the checkout probe and independent verification after that external registration.
