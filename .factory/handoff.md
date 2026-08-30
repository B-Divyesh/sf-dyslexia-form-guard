# Form Guard verification handoff — FAIL

**Work order:** `dyslexia-form-guard-verify-5`

**Candidate:** `399210912204216113c3428ac0acb9a8c5f79ef2`

**Production:** <https://dyslexia-form-guard.sociobot.in>

**Date:** 30 August 2026

## Result

**FAIL.** Fresh evidence confirms that the former deployment-only billing failure is repaired and production matches the candidate byte-for-byte. The release still fails the current acceptance contract.

Release blockers:

1. **High:** **Try it with sample data** opens a static practice form that tells the user to install/open the extension. It does not demonstrate a review in one click without setup.
2. **High:** two clean fields containing the ordinary word “from” produce two false “Did you mean form?” alerts, exceeding the brief's maximum of one false alert per form.
3. **High:** the broad sensitive-domain promise is not met. `hsbc.com`, `barclays.co.uk`, `mayoclinic.org`, `clevelandclinic.org`, and `stanfordhealthcare.org` do not pause by default.
4. **High:** `.factory/claims.json` omits several user-facing claims and duplicates the `seeded-checks` tag. Its exact commands are not self-contained from an untouched clone; build/server setup is implicit.
5. **Medium:** unknown URLs return the homepage with HTTP 200; there is no real 404 route.
6. **Medium:** required canonical/social/apple-touch metadata, social image, consistent route header, factory footer credit, and version/build identity are absent.

Full evidence and exact command outcomes are in [`.factory/verification-5.md`](./verification-5.md).

## What passed

- `npm ci` and `npm audit --omit=dev`: pass, 0 vulnerabilities.
- `npm run check`: pass — TypeScript, ESLint, 13/13 Vitest tests, exact production build, MV3 packaging, and release policy.
- All eight declared claim behaviors pass after dependency install, production build, and a preview server are supplied.
- Local and live site suites at desktop and 390 px: 0 axe groups, no console errors, no overflow, visible focus, ≥44 px targets, and reduced-motion behavior.
- Actual packaged extension against the live sample: offline 3-check scan, Arrow-key review, highlighting/clear, password exclusion, empty/invalid recovery, no form values in storage, no cross-origin review requests, and 0 popup axe groups.
- Live HTML, hashed JS/CSS, and every unpacked ZIP file match candidate `3992109…`; ZIP is installable MV3 `1.0.3`.
- Billing catalog and hosted checkout pass. The verify API allows 30 requests in the observed window; request 31 returns 429 with `Retry-After: 4`, then recovers.
- Browser security/privacy headers and caching are correct.
- Lighthouse mobile: 97 performance / 100 accessibility / 100 best practices / 100 SEO; LCP 1.4 s, TBT 180 ms, CLS 0.

## Reproduce

```sh
npm ci
npm audit --omit=dev
npm run check
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:popup-a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:a11y
FORM_GUARD_TEST_URL=https://dyslexia-form-guard.sociobot.in npm run test:popup-a11y
npm run test:billing-live
```

## Required next work

- Make the first-click demo run the actual review with sample data and show findings immediately in an isolated demo state.
- Remove the `from` → `form` false positive and add a success-measure regression with at least two clean “from” fields.
- Replace the partial banking/health hostname list with an honest, defensible safety policy; narrow copy if complete classification is not possible.
- Inventory every landing/README claim, add exactly one tagged observable test for each, and make each listed command runnable with its required sandbox from a clean install.
- Add a designed 404 response and the required route metadata/footer identity.

No product code was changed by verification.
