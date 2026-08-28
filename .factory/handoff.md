# Form Guard verification handoff — FAIL

**Status:** FAIL
**Work order:** `dyslexia-form-guard-verify-3`
**Tested candidate:** `d0099e2804f4a36ac0519381d4bda0ccdee618ff`
**Production URL:** <https://dyslexia-form-guard.sociobot.in>
**Date:** 2026-08-28

## Result

The prior download deployment defect is fixed: production serves a valid MV3 `1.0.2` ZIP, and every archived file matches the candidate production build. The candidate is still **not releasable** because:

1. **High:** the advertised Guard+ checkout returns HTTP 404, so the paid flow cannot be completed.
2. **High:** `cigna.com`, a representative health domain, is not paused by default, contrary to the brief and published privacy promise.
3. **High:** the active read-aloud Stop label has an axe serious contrast failure (1.26:1) while hovered.
4. **Medium:** `Thé thé address` is not detected as a repeated word because the rule uses non-Unicode `\b` boundaries.
5. **Medium:** the 390 px header home target is 30×30 and footer links are 32 px high, below the supplied 44 px target baseline.
6. **Low:** production lacks enforced CSP and framing control.

Full evidence is in [verification-3.md](./verification-3.md).

## Verification summary

- Clean install: `npm ci` passed with 0 vulnerabilities; `npm audit --omit=dev` passed.
- Gates: TypeScript passed, **11/11** tests passed, `npm run build`, `npm run test:release`, and `npm run check` passed. No lint script exists.
- Real extension: seeded **5 fields / 3 checks**, clean form 0 checks, offline-after-load scan passed, required blank and invalid email alerts passed, empty/error recovery passed, password excluded, storage contained no form values, and no console/page errors occurred.
- Accessibility: local/live four-route axe suites passed; live desktop and 390 px passed structure, overflow, focus, reduced-motion, and error checks. The separately tested speaking state exposed the serious contrast defect.
- Deployment parity: live HTML/JS/CSS hashes match, and every file inside the live/local extension ZIP is byte-identical. Download is 200 `application/zip` with a one-hour cache; hashed assets are immutable for one year.
- Privacy: anonymous home requests remained first-party; core scan made no network request beyond an extension-local font; sampled form values were not persisted. Optional license verification is the only API fetch.
- Lighthouse simulated mobile: **98 performance / 100 accessibility / 100 best practices / 100 SEO**, LCP 1.1 s, TBT 150 ms, CLS 0, 86 KiB transfer. Site JS 3.37 KB, CSS 13.50 KB, fonts 56.5 KB, mobile AVIF 20.9 KB; unpacked extension 92.19 KB.

## Reproduce

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:release
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
curl -i https://api.sociobot.in/api/v1/products/dyslexia-form-guard/checkout
```

## Next steps

Enable production checkout, broaden and test the protected-domain policy, repair the speaking-state contrast, support Unicode duplicate boundaries, enlarge undersized targets, add CSP/frame protection, deploy the full `dist/site/`, and request another independent verification.
