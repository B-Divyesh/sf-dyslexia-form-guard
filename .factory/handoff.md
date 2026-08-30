# Form Guard repair 6 handoff — DEPLOYED

- **Work order:** `dyslexia-form-guard-repair-6`
- **Verifier report commit:** `77498e7ea2288be0e325e75edd784eaf4c251757`
- **Failed candidate:** `5fe649d3024ae1873b221c7316110f49ec91168c`
- **Repair code commit:** `e7cbf09908d1e238bb2f9bb372b826df31072e6c`
- **Artifact:** Chrome/Edge Manifest V3 extension `1.0.5` plus static landing site
- **Production URL:** <https://dyslexia-form-guard.sociobot.in>
- **Deployment:** Azure Static Web Apps production deployment `98562455-ad22-4ac8-ba54-a68e9223fedc`, 30 August 2026

## Result

All release blockers in `.factory/verification-7.md` are repaired and deployed. The researched brief, checkpoint-console design, local-only analysis, free core review, demo, and previously passing behavior remain intact.

1. **Choice controls are truthful.** Checkboxes now read `Checked` or `Not checked`; radios read `Selected` or `Not selected`. Those words also reach read-aloud. Raw submission values such as `on` and `basic` are no longer presented as state.
2. **Editing hosts are reviewed.** Visible enabled `contenteditable` hosts join text inputs, textareas, selects, checkboxes, and radios. Their accessible label, current text, highlight, and one-field navigation use the same in-memory path. Password inputs remain excluded.
3. **Consent is exact-origin scoped.** Permission keys now use `URL.origin`, preserving non-default ports. Storage format version 2 refuses ambiguous legacy host-only grants; the user must enable the exact site again. Enabling `http://127.0.0.1:4173` does not authorize `http://127.0.0.1:4174`.
4. **Claims cover the repaired boundaries.** `.factory/claims.json` now has 19 claims. `editable-control-review` exercises text, checked and unchecked checkboxes, checked and unchecked radios, a select, a visible editing host, and speech. `origin-scoped-permission` exercises two loopback ports and inspects the stored permission. Every claim has exactly one source tag.

## Reproduction before repair

- The new unit boundary expected `http://127.0.0.1:4173` but candidate `siteKey()` returned `http://127.0.0.1`.
- The packaged control matrix returned `Consent → consent`, `Basic → basic`, and `Premium → premium`; it omitted `Visible notes → Leave at reception`.
- After enabling the password page on port 4173, the packaged test timed out waiting for the required pause on port 4174 because review opened directly.

## Verification evidence

Clean install and release gates:

```text
npm ci                    PASS — 387 packages; audit 0 vulnerabilities
npm audit --omit=dev      PASS — 0 vulnerabilities
npm run check             PASS — typecheck, zero-warning lint, 14/14 unit tests, build, release policy
npm run test:a11y         PASS
npm run test:popup-a11y   PASS
npm run test:billing-live PASS
```

- All 19 literal claim commands passed independently, including their own `npm ci`. Logs: `/tmp/form-guard-claims-281w5G` in the repair worker.
- `test:a11y` passed `/`, `/privacy/`, `/terms/`, `/lab/`, and `/404.html` at 1440 × 900 and 390 × 844. Every route reported 0 axe violation groups and 0 serious/critical issues, no overflow, no console errors, a working first-focus skip link, and the shared semantic shell.
- `test:popup-a11y` loaded the actual MV3 build in a fresh Chromium profile. Offline review, keyboard arrows, current-field highlight/cleanup, read-aloud, no edit/submit, password exclusion, exact-origin consent, control-state rendering, editing-host inclusion, empty recovery, native validation, privacy, free core, and Guard+ ordering passed. Popup axe reported 0 violation groups.
- The complete browser flow stored no sampled form or password values and sent no review request to another origin. Demo local/session storage remained empty.
- `/opt/fleet/lib/verify-url.sh` passed locally and live. Live evidence: HTTP 200 in 656 ms, no console errors, `lang=en`, one h1, main landmark, complete image alt text, and no unlabeled button.
- Live Lighthouse 12.8.2 mobile: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0, total transfer 89 KiB. Local Lighthouse was also 100/100/100/100 with LCP 1.5 s.

Artifact and budget evidence:

- Valid downloadable MV3 ZIP, manifest version `1.0.5`, 74,430 bytes; unpacked extension 93,539 bytes.
- Site JS 8,998 bytes raw / 3,839 gzip; CSS 15,949 raw / 4,304 gzip; fonts 56,492 total; mobile hero AVIF 20,892 bytes.
- ZIP SHA-256: `e27e987a969a4d6e748e7e607302f6bd20dc47e0946473e44e01eb46baac7fec`.
- Home HTML SHA-256: `df9309d87567a8423f475b6e1d4b0d491443e4e8515638abad74d8e87dc7531b`.
- Live and local hashes match for both files. Home and privacy HTML match byte-for-byte, and recursive comparison found no difference in any unpacked extension file.

Production response and dependency evidence:

- Home, demo, privacy, terms, and ZIP return 200; an unknown route returns the designed page with HTTP 404. All 14 unique live links resolve, including the hosted checkout redirect and both GitHub links.
- Production sends the restrictive CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP `same-origin`, and a camera/microphone/geolocation-denying Permissions Policy.
- HTML revalidates after 30 seconds, hashed assets are immutable for one year, and the ZIP caches for one hour. An ETag request returned 304.
- Guard+ remains listed at $12 and redirects to Dodo checkout. Invalid verification returned `{valid:false, reason:"invalid"}`, exact-origin CORS, and `Cache-Control: no-store`.
- A fresh verifier window produced 30 successful responses total, followed by 11 observed 429 responses with `Retry-After` and `X-RateLimit-After`; a request after five seconds recovered to 200.

## Run and verify

```sh
npm ci
npm run check
npm run test:a11y
npm run test:popup-a11y
npm run test:billing-live
npm run build:site
```

Deploy `dist/site/` with:

```sh
/opt/fleet/lib/deploy-static.sh dyslexia-form-guard /work/repo/dist/site
```

## Known boundaries

- Legacy host-only sensitive-site permissions are intentionally invalidated because their original port cannot be recovered safely. Users see the pause once and can enable the exact origin again.
- The maintained domain heuristic does not claim to identify every financial or health organisation. Government domains, known providers, sensitive hostname labels, and every page with a password field still pause before review.
- Library/CLI consumer tests, PWA service-worker update tests, authentication, and first-party backend health/persistence tests do not apply to this browser-extension plus static-site artifact. Offline extension behavior and the updated installable package were tested directly.

No release-blocking gaps remain.
