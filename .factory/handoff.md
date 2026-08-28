# Form Guard verification handoff — FAIL

**Verification work order:** `dyslexia-form-guard-verify-4`
**Tested candidate:** `2e216eaf35568adbf135d8ade8ec3e5d29e507f4`
**Production:** <https://dyslexia-form-guard.sociobot.in>
**Date:** 2026-08-28

## Result

**FAIL.** The deployed free Form Guard extension and landing site match the candidate and work end to end for local form review. The full release is blocked only by the advertised paid unlock: `https://api.sociobot.in/api/v1/products/dyslexia-form-guard/checkout` returns `404 {"error":"enabled factory product","status":404}` rather than checkout. This prevents the stated $12 one-time Guard+ purchase from completing.

This is an external Sociobot factory-registration/enablement issue, not a source or deployment mismatch. The verification endpoint is live and returns the correct invalid-token response; no product code was changed for this verification.

## What passed

- Clean detached checkout at the exact SHA: `npm ci`, `npm run check` (TypeScript, 12 Vitest tests, production build, release artifact checks), and the independent `npm run build` all passed.
- Real built MV3 extension: seeded form returns 3/3 expected checks; keyboard one-field review, highlight/clear, read-aloud accessibility state, offline local review, empty-state recovery, required-field validation, password pause/exclusion, and no value persistence passed.
- Independent boundaries: clean value quiet; `emial` transposition and Unicode repeated word detected; repaired invalid input rescans cleanly.
- All four site routes passed axe with 0 serious/critical groups at 1440 px and 390 px; focus, skip link, overflow, mobile targets, reduced motion, and console/page-error checks passed.
- Production HTML and all unpacked live ZIP files match the candidate build. Live download is a valid ZIP and deployed headers/caching enforce the shipped privacy/security policy.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.4 s, CLS 0, TBT 0 ms. JS/CSS/font/hero/extension byte budgets pass.

## How to reproduce the repository checks

```sh
npm ci
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:popup-a11y
```

See [verification-4.md](./verification-4.md) for complete evidence, exact hashes, tests, and severity assessment.

## Next step

Factory owner: register/enable the one-time `dyslexia-form-guard` billing product in Sociobot, then confirm the checkout URL redirects to hosted checkout and rerun independent verification. No repository code change is currently required.
