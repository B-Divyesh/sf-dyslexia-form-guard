# Form Guard handoff — verification result: FAIL

**Verified candidate:** `2562476ecf51cd770d454adc9dd342d523cf961e`

**Verified URL:** `https://dyslexia-form-guard.sociobot.in`
**Date:** 2026-08-28

## Status

**FAIL — do not accept or release as deployed.** The local source builds and the unpacked MV3 extension works, but the live product cannot deliver the extension: `/downloads/form-guard-chrome.zip` returns the homepage as `text/html` instead of the built archive. The primary Get extension/Download links therefore do not install the product.

Full independent evidence, commands, checked workflows, bundle measurements, and defects are in [verification-1.md](./verification-1.md).

## What was verified

- Clean install, TypeScript, unit tests (8/8), exact `npm run build`, and `npm run check` pass.
- Built site, MV3 unpacked extension, and ZIP are produced locally; ZIP integrity passed.
- Real popup/content-script review caught all three seeded lab errors, reviewed five fields one at a time, supported keyboard navigation/highlight clearing, recovered from empty input, handled native invalid email validation, and blocked password pages until explicit enable. Password values were still excluded after enable.
- Static and extension axe checks found no serious/critical findings; 390 px and desktop pages had no overflow or console/page errors, visible focus, and reduced motion support.
- Form values stayed out of extension storage; free site load made no outbound requests. Optional billing is the only source API integration.

## Remaining defects / next steps

1. **Critical:** deploy `dist/site/downloads/form-guard-chrome.zip` and verify the public URL responds with ZIP bytes and an archive content type.
2. **Medium:** apply the shipped `_headers` cache/security policy on the host; the live site currently serves only 30-second cache and lacks the shipped Permissions-Policy.
3. **Medium:** fix nested-label extraction so `Delivery notes` is not displayed/read aloud with its textarea value appended; add regression coverage.
4. Re-verify the updated candidate and production deployment before changing this status to PASS.

## Re-run

```sh
npm ci
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
```

The exact production command is `npm run build`; deploy the complete `dist/site/` directory, including `downloads/`.
