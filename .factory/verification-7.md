# Independent verification 7 — FAIL

**Date:** 2026-08-30

**Work order:** `dyslexia-form-guard-verify-7`

**Candidate:** `5fe649d3024ae1873b221c7316110f49ec91168c`

**Production URL:** <https://dyslexia-form-guard.sociobot.in>

**Artifact:** Chrome/Edge Manifest V3 extension `1.0.4`

## Verdict

**FAIL.** The previous deployment-only failure is gone: all 17 mandatory claim commands pass from the candidate, the live $12 checkout works, the billing verifier enforces a 30-request window, and production matches the candidate artifact. The seeded text-field job works locally, offline, by keyboard, and without sending form text away.

The candidate still fails the researched “arbitrary forms” and privacy/safety contract in fresh scenarios outside the seeded text-only fixture:

1. **Choice controls are misrepresented.** The actual packaged extension reviewed a checked checkbox as `Consent → on`, an unchecked radio as `Basic → basic`, and a checked radio as `Premium → premium`. It never exposes checked/unchecked state, so an unselected answer is presented the same way as a selected answer. A visible `contenteditable` field was omitted entirely. This is unsafe for a final review of a high-stakes form.
2. **Sensitive-site permission is not origin-scoped.** Enabling a password form at `http://127.0.0.1:4173` stored `http://127.0.0.1`. A fresh password form at the distinct origin `http://127.0.0.1:4174` then bypassed the pause and opened directly in review. The README and privacy copy promise explicitly enabled origins, but the key drops the port.
3. **The claims inventory does not cover those broad promises.** `.factory/claims.json` tests five text controls and a default-port site. It has no representative checkbox/radio/contenteditable test and no non-default-port isolation test, although README lines 3, 10, and 18 promise visible editable fields and explicitly enabled site origins. The claims contract makes an unproved user-facing claim release-blocking.

No product code was modified during verification.

## Mandatory first-read and demo gate

Cold production visits at 1440 × 900 and 390 × 844 plainly answer:

- **What:** “Check important forms before you submit.”
- **For whom:** dyslexic people who want to catch repeated words, swapped letters, and mismatched retyped values without sharing form data.
- **What to click:** **Try it with sample data** (alongside the real download action).

The demo action is one click. `/lab/` immediately opens on **Delivery notes**, **3 CHECKS**, a repeated-word finding, and an adjacent-letter-swap finding. Its persistent banner says **Demo — sample data, nothing is saved**, with **Reset demo** and **Start for real**. Storage stayed empty and the complete demo flow made only same-origin requests.

At the shorter 1365 × 768 boundary, the header download remains visible but the sample-data action starts below the viewport. The required desktop 1440 × 900 and 390 px mobile checks pass the first-read gate.

## Mandatory claims

The worktree was clean, switched to the exact candidate, and each literal command from `.factory/claims.json` was run independently. Every command includes its own `npm ci`.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `seeded-checks` | PASS | Three documented finding kinds in order |
| `false-alert-limit` | PASS | Two ordinary “from” sentences produced zero findings |
| `sensitive-domain-pause` | PASS | Listed government/banking/health fixtures paused |
| `offline-local-review` | PASS | Packaged extension found 3 checks after context went offline |
| `core-review-free` | PASS | Scan completed with no license; paid ordering disabled |
| `password-exclusion` | PASS | Password sentinel never appeared in review or storage |
| `privacy-local-only` | PASS | No reviewed value in storage and no cross-origin review request |
| `read-aloud` | PASS | Browser speech path received current label and value |
| `field-highlight` | PASS | Exactly one current field highlighted; Finish cleared it |
| `keyboard-review-navigation` | PASS | ArrowRight advanced the reviewed field |
| `never-edits-or-submits` | PASS | Seed value unchanged and submit listener did not fire |
| `native-validation-alerts` | PASS | Blank required control alerted; repaired value rescanned cleanly |
| `guard-plus-flagged-first` | PASS | Valid cached entitlement placed a flagged field first |
| `installable-mv3` | PASS | ZIP integrity, MV3/version, 404, response policy, and metadata passed |
| `sample-demo-review` | PASS | Desktop/mobile opened immediately on 3 checks and 2 details |
| `sample-demo-reset` | PASS | Desktop/mobile reset seed, kept submit disabled, storage empty |
| `guard-plus-checkout` | PASS | Catalog lists $12 and fresh checkout redirects to Dodo |

Exactly one `@claim:<id>` marker exists for each of the 17 declared IDs. The defect is coverage/inventory: the broad visible-control and enabled-origin promises have no boundary claim.

## Clean install, tests, and exact build

Environment used Node `v22.23.2`, npm `10.9.8`, and repository-pinned Playwright `1.58.2`.

```text
npm ci                  PASS — 387 packages; audit 0 vulnerabilities
npm test                PASS — 14/14 tests in 3 files
npm run typecheck       PASS — tsc --noEmit
npm run lint            PASS — ESLint, zero warnings
npm run build           PASS — exact production build
npm run test:release    PASS
npm run test:a11y       PASS
npm run test:popup-a11y PASS
npm audit --omit=dev    PASS — 0 vulnerabilities
```

Build output:

- Site JS: 8,998 B raw / 3,839 B gzip.
- Site CSS: 15,949 B raw / 4,304 B gzip.
- Self-hosted fonts: 56,492 B total.
- Mobile hero AVIF: 20,892 B.
- Unpacked MV3 extension: 92.68 kB.
- `dist/site/downloads/form-guard-chrome.zip`: valid MV3 `1.0.4` archive.

## End-to-end product behavior

The actual built extension was loaded into fresh Chromium profiles, not mocked.

Working seeded and recovery paths:

- Five sample text fields produced the intended repeated word, `emial` → `email`, and retyped-email mismatch: 3/3 intended seeded errors and no extra alert.
- A clean “I moved from Boston last year.” note plus matching emails produced **NO ALERTS**.
- Unicode `Thé thé address` produced one repeated-word check.
- Two populated malformed email controls produced two native-validation checks.
- Reset restored the exact seed and 3 checks; submit remained disabled.
- ArrowLeft/ArrowRight moved through the review; current-field highlight and read-aloud invocation worked.
- Empty-form recovery, required-field repair, offline review, Finish/no-submit, and Guard+ ordering all passed.
- Desktop and mobile demo edits remained in memory only.

Failing representative control case:

```text
Full name text input        → Full name / Sam Rivera
checked Consent checkbox    → Consent / on
unchecked Basic radio       → Basic / basic
checked Premium radio       → Premium / premium
selected Country select     → Country / India
visible contenteditable     → omitted
```

The cause is visible in `entrypoints/content.ts`: all non-excluded inputs are collected, but `controlValue` returns `.value` for checkbox/radio controls without `.checked`; `contenteditable` is not queried. A user cannot tell which choice is active from the one-field review or speech.

## Privacy, permissions, network, and billing

- Anonymous home → demo: same-origin HTML, JS, CSS, and fonts only; no analytics, tracking, CDN, AI, or other origin.
- Complete packaged review: no HTTP(S) request outside the product origin and no sampled form/password value in extension storage.
- Invalid license flow removed the token from the URL, contacted only `api.sociobot.in`, stored only the optional token/verdict, and explained that free review remains available.
- Invalid license responses are `200 {valid:false, reason:"invalid"}` with `Cache-Control: no-store`.
- A fresh 40-request verifier burst yielded **30 × 200** and **10 × 429**. Every 429 had `Retry-After: 4` and `X-RateLimit-After: 4`; a request after five seconds recovered to 200. Observed allowance: **30 requests per window per client**.
- Checkout claim passed against the public catalog and a fresh hosted Dodo redirect.

Sensitive permission boundary failure:

```text
Enable password page at http://127.0.0.1:4173
stored allowedSites: ["http://127.0.0.1"]
Scan password page at http://127.0.0.1:4174
result: review opened; no consent pause
```

`src/lib/domain-policy.ts:39-42` builds the permission key from protocol and hostname, not `URL.origin`, so non-default ports are collapsed.

## Deployment identity, headers, caching, and links

Production matches the candidate build:

- Home, demo, privacy, and terms HTML SHA-256 values match local output exactly.
- Live JS SHA-256: `311e97aa453585692e98c79439bd4b34b6990e4893d1f2b68c0b8a17d4c5acf9`, equal locally.
- Live CSS SHA-256: `ab35ab068a7ef69da6de0331699d6de1d73e621a722fb3ca88ef8b7423d87ed5`, equal locally.
- ZIP container hashes differ because archive timestamps are nondeterministic. Recursive unpacking found no differing file; every one of the 12 extension entries has the same SHA-256.
- Live download is `200 application/zip`, 74,203 B, with manifest MV3/version `1.0.4`.

Live responses include HSTS, restrictive CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP `same-origin`, `Referrer-Policy: no-referrer`, `nosniff`, and camera/microphone/geolocation-denying Permissions Policy. HTML uses 30-second revalidation; hashed assets use one-year immutable caching; the ZIP uses one hour. An ETag conditional request returned 304. A random path returns the designed HTML with HTTP 404. Every internal link/download and both GitHub links returned 200; checkout was covered by its mandatory claim.

## Accessibility, responsive behavior, and performance

- Live route suite: `/`, `/privacy/`, `/terms/`, `/lab/`, and `/404.html`, at 1440 × 900 and 390 × 844: **0 axe violation groups and 0 serious/critical findings** on every route.
- Live packaged popup: **0 axe groups and 0 serious/critical**, including active hovered Stop/read-aloud state.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 851 ms, no console errors, `lang=en`, one h1, main landmark, complete image alt text, and no unlabeled button.
- First Tab reaches the skip link with a 3 px cyan focus outline. Activating it skips header/banner controls; the next Tab reaches the first demo control.
- All visible mobile links, buttons, inputs, and textareas measured at least 44 × 44 CSS px. No tested route overflowed at 390 or the 720 px 200%-reflow proxy.
- Reduced motion matched, hid the scan line, limited animations/transitions to 0.01 ms, and had no mobile overflow.
- No console or page errors occurred in live desktop/mobile route or demo flows.
- Lighthouse 12.8.2 simulated mobile: **99 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.39 s, LCP 1.39 s, TBT 119.5 ms, CLS 0, total transfer 91,576 B. No field INP sample exists in this navigation audit; synchronous demo interactions updated immediately.

## Defects by severity

### High — selected state is wrong for common choice controls

Checkbox/radio controls are common on high-stakes forms. The review displays their raw HTML `value` regardless of checked state and speaks an unchecked option just like a checked option. This can reinforce rather than catch an incorrect answer. Encode checked/unchecked/group semantics or explicitly exclude unsupported controls, state the narrower scope, and add an end-to-end claim test.

### High — sensitive-site consent leaks across distinct origins

The saved permission drops non-default ports. Enabling one origin silently authorizes a second origin on the same hostname, contrary to the “explicitly enable that origin” privacy promise. Use `URL.origin`, migrate existing keys safely, and claim-test two ports.

### High — claims coverage omits the failing broad promises

All declared tests pass, but the inventory does not prove the public visible-editable-field or explicitly-enabled-origin claims at their material boundaries. The attached claims contract states that an unlisted user-facing claim is a release blocker.

### Medium — visible contenteditable fields are omitted

A visible `contenteditable="true"` control was absent from review even though the product says it reads visible editable fields. Either support it or narrow the public scope to supported native form controls.

## Not applicable

This is a static browser-extension product, not a library, CLI, PWA, authenticated product, or first-party backend. Library packing, CLI install, service-worker update/offline reload, Entra sign-in, and product-server concurrency/persistence/health checks do not apply. The only server-side dependency in scope—the Sociobot billing endpoints—was tested for checkout, invalid verification, recovery, and rate limiting.
