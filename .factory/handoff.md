# Form Guard repair handoff — DEPLOYED

**Work order:** `dyslexia-form-guard-repair-5`  
**Base verifier report:** `.factory/verification-5.md` (candidate `399210912204216113c3428ac0acb9a8c5f79ef2`)  
**Repair commit:** `f16fa9c11226a5428cf74b2e5ce24da6c58d31b2`  
**Artifact:** Chrome/Edge Manifest V3 extension `1.0.4` plus static landing site  
**Production URL:** <https://dyslexia-form-guard.sociobot.in>

**Deployment:** Azure Static Web Apps production deployment `8ec41f8a-b460-43f8-b818-d2da8be658e0` completed successfully on 30 August 2026. The deployed static artifact is the repair commit above.

## Result

All release blockers from verification 5 are repaired without changing the researched job-to-be-done or the local-first extension model.

1. **One-click demo:** `/lab/` is now a real in-page local review. It opens on Delivery notes with three checks and two visible findings, supports Previous/Next/Read, recalculates only in memory, has the persistent demo banner, prevents submission, and Reset demo restores the seed. Extension installation remains the explicit **Start for real** path.
2. **False alerts:** the ambiguous ordinary sources `from` and `three` are no longer treated as swaps to `form`/`there`. The verifier's two clean “from” sentences now return zero findings.
3. **Sensitive sites:** the policy covers the reported providers (`hsbc.com`, `barclays.co.uk`, `mayoclinic.org`, `clevelandclinic.org`, and `stanfordhealthcare.org`) plus their subdomains. Public wording is now honest: government domains and **known** banking/health providers pause by default. A complete global bank/health classifier cannot be safely inferred from a hostname alone; users still receive the explicit per-origin consent gate.
4. **Claims:** `.factory/claims.json` contains 17 observable claims, each with exactly one `@claim:<id>` test. Every command begins with `npm ci` and owns its build/server prerequisites. The former duplicate `seeded-checks` tag is removed.
5. **Static site:** unknown URLs now use Static Web Apps `responseOverrides` to serve the designed `/404.html`; all routes have canonical, Open Graph, Twitter, and Apple-touch metadata; the product social image is 1200 × 630; headers/footers are shared; footers include **Built by Param Factory · v1.0.4**.

## Verification evidence

Run from a clean dependency install on 30 August 2026:

```sh
npm ci                         # 387 packages; audit reports 0 vulnerabilities
npm audit --omit=dev           # 0 vulnerabilities
npm run check                  # PASS
npm run test:a11y              # PASS
npm run test:popup-a11y        # PASS
npm run test:billing-live      # PASS
```

`npm run check` passed strict TypeScript, ESLint with zero warnings, 14/14 Vitest tests, the clean production build, MV3 ZIP packaging, and release-artifact verification. The final ZIP is `dist/site/downloads/form-guard-chrome.zip`; it carries manifest version `1.0.4` and MV3.

All 17 declared clean-clone claim commands in `.factory/claims.json` passed. Their isolated runners build and stop their own loopback preview where needed; no manual Vite server or prebuilt extension is required.

Browser evidence:

- `test:a11y`: desktop and 390 px across `/`, `/privacy/`, `/terms/`, `/lab/`, and `/404.html`; **0 axe violation groups and 0 serious/critical** on every route. It also checks the skip link, 44 px targets, no horizontal overflow, shared shell/metadata, immediate demo findings, reset, and empty demo storage.
- `test:popup-a11y`: actual built extension in a fresh Chromium profile; offline local review, password exclusion, no form-text storage/outbound request, keyboard navigation, page highlight/clear, read-aloud request, native-validation recovery, free core review, and Guard+ flagged-first ordering all passed; **0 axe groups and 0 serious/critical**.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/`: HTTP 200, 575 ms local load, no console errors, `lang=en`, title, exactly one h1, main landmark, and complete image alt text.
- Lighthouse 12.8.2 simulated mobile against the built local site: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.1 s, LCP 1.4 s, TBT 0 ms, CLS 0. Evidence: `/tmp/tmp.RNJRIghRWG/lighthouse.json`.

Post-deploy live evidence:

- `/opt/fleet/lib/verify-url.sh` passed against the production URL: HTTP 200, 743 ms, no console errors, `lang=en`, title, one h1, main landmark, and complete image alt text.
- Live desktop and 390 px site suite passed all five routes, including `/404.html`, with **0 axe groups and 0 serious/critical**. The actual built extension passed the live `/lab/` popup suite with the same offline, keyboard, privacy, native-validation, and Guard+ checks and **0 axe groups / 0 serious/critical**.
- `GET /not-a-real-route-qa` is now **404 text/html**. `GET /downloads/form-guard-chrome.zip` is **200 application/zip**. The live ZIP SHA-256 is `cb638eeeafa0d17f390af4f0c92051e112becccd8ad94431e4d43c0e16c5cbde`, exactly matching the local build; its manifest is MV3 version `1.0.4`.

## How to run and deploy

```sh
npm ci
npm run check
npm run test:a11y
npm run test:popup-a11y
npm run test:billing-live
npm run build:site
```

Deploy `dist/site/` as the static work-order artifact. It includes the extension ZIP, social/touch assets, `404.html`, and `staticwebapp.config.json`.

## Known boundary

The extension intentionally does not claim that a hostname-only heuristic can identify every financial or health organisation worldwide. It pauses government domains, password pages, generic sensitive labels, and the maintained known-provider set before reading visible values; a user can explicitly enable a paused origin. This is the closest honest local-only safety policy to the brief without a tracking/cloud classification service.
