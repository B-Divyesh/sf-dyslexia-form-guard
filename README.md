# Form Guard

Form Guard is a local-first Chrome/Edge extension for people who want a calmer final check before submitting an important web form. It reads visible editable fields only after the user starts a review, then presents one field at a time and conservatively flags:

- repeated adjacent words;
- likely adjacent-letter transpositions against a small built-in vocabulary;
- mismatched confirmation/retyped values;
- field/value problems already reported by the browser’s native validation.

It can read the current field aloud, highlights that field on the page, and supports left/right arrow navigation. It never edits or submits a form. Password values are always excluded. Password pages, government domains, and known banking and health providers pause by default until the user explicitly enables that origin.

Live site: <https://dyslexia-form-guard.sociobot.in>

One-click sample: <https://dyslexia-form-guard.sociobot.in/lab/>. It runs the same local analysis on five safe seeded fields and opens directly on the three checks; it does not need the extension or save sample values.

## Privacy and positioning

Analysis runs inside the browser. Form values remain in memory for the popup session and are never persisted, logged, or sent to a server. The extension stores only explicitly enabled site origins, a review-order preference, and optional Guard+ license state. Form Guard is a general-purpose utility, not a medical device, diagnostic aid, grammar checker, or guarantee that a form is correct.

Guard+ is an optional $12 one-time supporter unlock for flagged-first ordering. The complete checking, one-field review, read-aloud control, keyboard path, and safety behaviour are free. Purchases and license verification use the Sociobot billing API; payment details never enter this repository or product.

## Stack and structure

- WXT + TypeScript, Manifest V3 extension in [`entrypoints/`](./entrypoints)
- Pure TypeScript analysis rules in [`src/lib`](./src/lib)
- Vite + vanilla TypeScript landing site in [`site/`](./site)
- Original generated hero source and provenance in [`assets/src`](./assets/src)
- Product brief, visual thesis, and handoff in [`.factory`](./.factory)

No runtime CDN, analytics library, cloud spell checker, or paid third-party service is used.

## Develop

Prerequisites: Node.js 20.19 or newer and npm.

```sh
npm ci
npm run dev          # WXT extension development
npm run dev:site     # landing site at http://localhost:5173
```

To load the development extension, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the directory printed by WXT.

## Test and build

```sh
npm test             # unit tests for analysis and domain policy
npm run typecheck    # strict TypeScript checks
npm run lint         # ESLint across source, tests, and build scripts
npm run check        # type, lint, unit tests, production build, and package policy
npm run build        # clean full production build
npm run build:site   # deployment build: site, MV3 extension, and download ZIP
npm run test:a11y    # self-contained site desktop/mobile, keyboard, axe, and demo check
npm run test:popup-a11y # self-contained packaged-extension integration, axe, privacy, and offline check
npm run test:billing-live # public catalog plus real hosted-checkout redirect
```

The build creates:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension;
- `dist/site/index.html` — static deploy root;
- `dist/site/downloads/form-guard-chrome.zip` — packaged extension linked by the site.

Both browser commands build the current artifact and start/stop their own loopback
preview. `test:a11y` checks every site route at desktop and 390 px, including
keyboard skip links, overflow, metadata, the shared header/footer, and the
immediate local demo result. `test:popup-a11y` loads the built MV3 extension
against `/lab/`, takes the page offline after it loads, exercises keyboard,
read-aloud, highlight, native-validation, password, privacy, and Guard+ ordering
paths, and runs axe while the read-aloud control is in its hovered Stop state.
It uses `xvfb-run` for Chromium's extension UI in headless Linux environments.

The safe seeded demo at `/lab/` contains exactly three expected alerts. Reset demo restores its sample fields, and the form never submits or saves changes.

Every user-facing behavior is listed in [`.factory/claims.json`](./.factory/claims.json). Each listed command starts with `npm ci`, so a verifier can run it from a fresh clone without supplying a prior build or server.

## Install a production build locally

1. Run `npm run build`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select `dist/extension/chrome-mv3`.
5. Run `npm run test:a11y` once or serve `dist/site/` locally, then open `/lab/`, select the Form Guard toolbar icon, and start a review.

## Deployment

Deploy the complete `dist/site/` directory made by `npm run build:site`, including `downloads/form-guard-chrome.zip` and `staticwebapp.config.json`. `build:site` deliberately packages the extension because it is the factory deployment command; this prevents a landing-site-only deploy from dropping the install artifact. The configuration serves the designed 404 document for unknown URLs and applies the cache and privacy headers. The factory owns DNS and deployment. The billing integration uses the registered slug-only endpoint `https://api.sociobot.in/api/v1/products/dyslexia-form-guard/...`; no provider credentials or product IDs are stored here. Run `npm run test:billing-live` to verify the public `$12` product and hosted-checkout redirect.

## License

MIT. See [LICENSE](./LICENSE).
