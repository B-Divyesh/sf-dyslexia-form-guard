# Independent verification 5 — FAIL

**Date:** 2026-08-30

**Candidate:** `399210912204216113c3428ac0acb9a8c5f79ef2`

**Production URL:** <https://dyslexia-form-guard.sociobot.in>

**Artifact:** Chrome/Edge Manifest V3 extension `1.0.3`

## Verdict

**FAIL.** The deployed files match the candidate, the installable extension works end to end for the seeded flow, the former checkout-only failure is repaired, and the quality/performance/accessibility suites pass after their prerequisites are prepared. The candidate nevertheless fails the acceptance contract for four independent release-blocking reasons:

1. **The advertised one-click sample is not a working product demo.** The first screen clearly says what the product does, who it is for, and offers **Try it with sample data**. That one click opens `/lab/`, but the next screen says to install Form Guard and open the extension. It shows no review result and performs none of the product's job without multi-step browser-extension installation.
2. **A representative clean form exceeds the false-alert success limit.** Each normal use of “from” is reported as `Check “from”. Did you mean “form”?`. Two clean fields containing “from” produce two false alerts, while the brief permits no more than one per form.
3. **The default sensitive-domain pause is incomplete.** The hard-coded policy returns no pause reason for major banking and health domains including `hsbc.com`, `barclays.co.uk`, `mayoclinic.org`, `clevelandclinic.org`, and `stanfordhealthcare.org`. Logged-in forms without a password field on those sites are reviewed without the brief's required extra consent step.
4. **The claims contract is incomplete and its commands are not clean-clone runnable by themselves.** User-facing claims for read-aloud, field highlighting, Arrow-key navigation, never editing/submitting, native-validation alerts, and Guard+ flagged-first ordering are absent from `.factory/claims.json`. The `seeded-checks` tag also appears twice, rather than exactly once. On the mandated untouched-clone first run, seven of eight declared commands failed for missing install/build/server prerequisites; the popup command waits indefinitely when the built extension is absent, and `test:a11y` assumes an externally started server.

No product code was modified during verification.

## Mandatory first-read and demo gate

Cold desktop and 390 px sessions saw:

- Job: **“Check important forms before you submit.”**
- Audience/change: **“For dyslexic people who want to catch repeated words, swapped letters, and mismatched retyped values without sharing form data.”**
- First actions: **Download for Chrome / Edge** and **Try it with sample data**.
- Plain facts: checks stay in the tab; review works offline; core is free and Guard+ is $12 once.

The words satisfy the first-read requirement. The demo does not. After one click, `/lab/` has five seeded fields and the correct persistent **Demo — sample data, nothing is saved** banner, Reset demo, Start for real, empty storage, and disabled submission. It also explicitly instructs the visitor to install/open the extension and contains zero review/finding/result elements. This is a practice input fixture, not the required one-click sandbox demonstration of product value.

## Claims execution

The literal required first run occurred before any other repository setup. Results were:

| Claim | Untouched-clone command | After `npm ci`, build, and served demo |
| --- | --- | --- |
| `seeded-checks` | FAIL — `.wxt/tsconfig.json` absent | PASS — 1 tagged test |
| `sensitive-domain-pause` | FAIL — `.wxt/tsconfig.json` absent | PASS — 1 tagged test |
| `offline-local-review` | FAIL — `@axe-core/playwright` absent | PASS — packaged offline scan |
| `password-exclusion` | FAIL — `@axe-core/playwright` absent | PASS — sentinel never displayed/stored |
| `privacy-local-only` | FAIL — `@axe-core/playwright` absent | PASS — no outbound review requests or stored values |
| `installable-mv3` | FAIL — `vite` absent | PASS — build plus release verification |
| `sample-demo-reset` | FAIL — `@axe-core/playwright` absent | PASS — desktop and 390 px reset |
| `guard-plus-checkout` | PASS | PASS — $12 catalog entry and Dodo redirect |

After ordinary dependency installation, the popup claim command still needs a prior production build and the site claim command still needs an independently running preview at `127.0.0.1:4173`. With those prerequisites supplied outside the declared commands, all eight behavior checks pass. This does not cure the explicit clean-clone claim-command requirement or the unlisted claims.

Cross-check evidence:

- `@claim:seeded-checks` occurs in both `src/lib/analyzer.test.ts` and `scripts/popup-a11y-check.mjs`.
- No claim entry exists for page copy/README statements such as “It can read the current field aloud,” “highlights that field,” “supports left/right arrow navigation,” “never edits or submits,” native browser-validation alerts, or paid flagged-first ordering.
- The popup script exercises some of these paths, but they are not listed as claims and read-aloud is simulated by changing button state rather than asserting a spoken utterance.

## Clean install, tests, and production build

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright pinned to `1.58.2`.

```sh
npm ci
npm audit --omit=dev
npm run check
```

- Install: 387 packages; audit reports 0 vulnerabilities.
- TypeScript: pass.
- ESLint: pass with zero warnings.
- Vitest: **13/13 pass** across analyzer, domain-policy, and field-label suites.
- Exact production build: pass; produces `dist/site/`, `dist/extension/chrome-mv3/`, and `dist/site/downloads/form-guard-chrome.zip`.
- Release verifier: pass; valid MV3 `1.0.3` package and Static Web Apps policy.
- Live billing test: pass; public catalog lists exact USD 1200 minor-unit product and checkout redirects to a fresh Dodo hosted session.

## End-to-end extension behavior

Fresh Chromium profiles loaded the actual built MV3 package and exercised it against both local and live `/lab/`:

- The five-field seed produces exactly three intended findings in order: repeated word, adjacent swap, and retyped-value mismatch.
- Review still completes after the sample page is loaded and Chromium goes offline; status is `OFFLINE / LOCAL`.
- ArrowRight advances the one-field review; the current page field gets one highlight; Finish clears it.
- A password sentinel is excluded even after explicitly enabling the paused site and never enters extension storage.
- An empty editable-field state focuses its recovery action; adding a required field and retrying yields one validation check; entering `A-104` and rescanning yields `NO ALERTS`.
- The active hovered read-aloud Stop state has the intended high-contrast cyan treatment.
- The packaged popup flow reports 0 axe groups, 0 serious/critical findings, and no console/page errors.

Boundary accuracy evidence, executed directly against candidate analyzer code:

```text
from => form
form => null
emial => email
adn => and
teh => the
```

A clean form with “I moved from Boston last year” and “I work from home three days a week” receives two transposition findings. This violates the researched success measure and undermines the landing claim that only strong signals are alerted with low false alarms.

Sensitive-domain boundary evidence:

```text
hsbc.com                 => null
barclays.co.uk           => null
mayoclinic.org           => null
clevelandclinic.org      => null
stanfordhealthcare.org   => null
bankofamerica.com        => banking domain
cigna.com                => health-related domain
forms.gov                => government domain
```

## Privacy, network, billing, and server limits

- A fresh Playwright home → sample flow made 11 requests, all to `https://dyslexia-form-guard.sociobot.in`; local storage remained empty and there were no console/page errors.
- The packaged extension's complete live review request log contains no HTTP(S) request to another origin. Stored extension data contains neither `Sam Rivera` nor `TOP-SECRET-998`.
- Invalid license recovery is clear: a blank submission says **Paste a license token first** and returns focus to the field; an invalid token calls only the Sociobot verify URL, reports that free review remains available, and stores only the optional token/verdict.
- No analytics, tracking, CDN script/font, Azure/OpenAI runtime call, or cloud form-text analysis was observed.
- The production license-verification endpoint enforces an observed allowance of **30 requests per window** from one client. Request 31 returned **429** with `Retry-After: 4` and `X-RateLimit-After: 4`; a later request recovered to 200.
- Invalid license responses are `200 {valid:false, reason:"invalid"}` with `Cache-Control: no-store`.

## Deployment parity, response policy, and caching

Live bytes match the candidate build:

| Asset | Candidate SHA-256 | Live SHA-256 |
| --- | --- | --- |
| `index.html` | `ee29ffa4…dd3d8a` | `ee29ffa4…dd3d8a` |
| `main-DCL-xw5H.js` | `c751f8ec…26a3a1` | `c751f8ec…26a3a1` |
| `main-CMsNk3Gy.css` | `ab12fc27…eec62f` | `ab12fc27…eec62f` |

The live and local ZIP files are both 74,117 bytes. `unzip -t` passes, recursive unpacked comparison has no differences, and both manifest hashes are `255dae7a…97e0b`. The live download is `200 application/zip`; manifest version is 3 with extension version `1.0.3`.

Browser-observed home response headers include the shipped restrictive CSP, HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, COOP `same-origin`, and camera/microphone/geolocation-denying Permissions Policy. HTML uses `max-age=30`; hashed JS/CSS use one-year immutable caching; the ZIP uses one-hour caching.

Deployment defect: a random path such as `/not-a-real-route-qa` and `/404.html` both return the homepage as **200 text/html**. There is no designed 404 file or `responseOverrides` entry.

## Accessibility, responsive behavior, and performance

- Repository Playwright/axe suite: 4 routes × desktop and 390 px, **0 total axe groups / 0 serious or critical** in every run, both local and live.
- `/opt/fleet/lib/verify-url.sh`: 200, 693 ms, `lang=en`, title, exactly one h1, main landmark, complete image alt text, no unlabeled buttons, and no console errors.
- Keyboard first focus is the visible Skip link with a 3 px cyan outline and 4 px offset; native links/buttons and form recovery are keyboard operable.
- All visible interactive targets on `/`, `/lab/`, `/privacy/`, and `/terms/` are at least 44 × 44 CSS px at 390 px. No route has horizontal overflow.
- Reduced motion hides the scan line and reduces animation/transition duration to `0.01ms`.
- Lighthouse 12.8.2 simulated mobile: **97 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.2 s, LCP 1.4 s, TBT 180 ms, CLS 0, 87 KiB transfer. No field INP sample was available in the navigation-only audit.
- Budgets pass: JS 3,372 B raw / 1,600 B gzip; CSS 14,190 B raw / 3,969 B gzip; fonts 56,492 B; mobile hero AVIF 20,892 B; unpacked extension 92,467 B.

Site-structure defects: all pages lack canonical, Open Graph, Twitter-card, and apple-touch metadata; there is no required 1200 × 630 social image; the demo title is **Practice form — Form Guard**, not **Demo — Form Guard**; headers are not consistent across routes; and footers omit **Built by Param Factory** plus version/build identity.

## Defects by severity

### High — one-click demo gate fails

`/lab/` is realistic and isolated, but it is only an input fixture. It requires extension download, extraction, Developer mode, Load unpacked, toolbar activation, and scan before showing any product result. The acceptance contract explicitly makes absence of a one-click sample-data demo a FAIL.

### High — clean input exceeds the allowed false-alert count

Two ordinary fields containing “from” generate two false “from” → “form” alerts. The brief's measurable limit is no more than one false alert per form.

### High — banking/health pause claim and safety constraint are false in common cases

The allowlist catches several patched providers but misses other major providers. A hard-coded partial list cannot support the broad copy **Banking, health, government ... domains pause by default**. This is a safety/privacy boundary for high-stakes forms, not merely a copy detail.

### High — claims inventory and clean-run contract are incomplete

Multiple user-reliable claims are unlisted, one tag is duplicated, and the exact declared commands do not run from the untouched clone without implicit build/server orchestration. The work order explicitly makes either unlisted or failing claim tests release-blocking.

### Medium — no real 404 route

Unknown URLs return the homepage with HTTP 200. This breaks not-found semantics and the attached site-structure contract.

### Medium — required route/social metadata and factory footer identity are missing

Canonical/OG/Twitter/apple-touch metadata, the social image, consistent route header, factory credit, and version/build identity are absent.

## Not applicable

This is a browser extension with a static marketing/download site, not a library, CLI, PWA, authenticated application, or first-party backend. Consumer package install, CLI demo, PWA service-worker update/offline reload, Entra sign-in, and backend concurrency/persistence/health checks do not apply. The factory billing endpoint was tested separately, including its rate limit.
