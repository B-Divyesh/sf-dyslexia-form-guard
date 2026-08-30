# Form Guard visual thesis

## Direction: checkpoint console

Form Guard uses a **pixel/demoscene language** as a calm, deliberate checkpoint rather than a nostalgic game skin. A form moves through a local inspection pass: raw values enter a scan line, possible slips become addressable markers, and the user advances one field at a time. Crisp one-pixel keylines, stepped corners, an eight-column dot field, and compact status readouts make that process visible. The visual metaphor is a private instrument panel, not a medical device and not a generic cybersecurity shield.

The site and extension are explicitly dark-mode-first. This single-mode treatment reduces context changes between browser pages and the review overlay and lets the amber inspection state remain consistent. Every state also uses an icon or label, never colour alone.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Void | `#090c14` | Main background; deep blue-black rather than pure black |
| Console | `#111827` | Raised panels and extension surfaces |
| Console high | `#19243a` | Active and hover surfaces |
| Paper | `#f3f7e8` | Primary copy; warm off-white reduces glare |
| Muted | `#aeb9c6` | Secondary copy, ≥ 4.5:1 on Void and Console |
| Scan lime | `#b8f34a` | Primary action and safe/ready status; black text |
| Signal amber | `#ffca58` | Review warnings and current-field marker; black text |
| Relay cyan | `#65d9e8` | Focus rings, links, spoken/readout state |
| Fault coral | `#ff7f73` | Errors and blocked states, paired with text/icons |

Focus uses a two-layer cyan/void ring so it remains visible on every surface. Warning panels use amber keylines plus an explicit `CHECK` label. Tested token pairs target WCAG AA for normal text.

## Typography

- **Interface/body:** `Atkinson Hyperlegible Next`, locally vendored WOFF2, 400 and 700. Its differentiated glyph shapes support fast review without making a medical claim.
- **Status/display:** `Departure Mono`, locally vendored WOFF2, 400. Uppercase, tracked labels and tabular numbers evoke a demoscene status console. It is limited to headings, counters, labels, and short buttons; body copy remains proportional.
- Scale: 14px status, 16–18px body, 20px subhead, `clamp(2.4rem, 7vw, 5.8rem)` site display. Body line-height is 1.55–1.65 with a 68-character measure.

## Layout and spacing

An 8px base rhythm governs all spacing: 4, 8, 12, 16, 24, 32, 48, 64, and 96px. Content caps at 1160px. The landing hero uses an asymmetric 5/7 split: proof and action on the left, the generated inspection-world illustration on the right. Extension surfaces use an 8px inset grid and a 400px popup width. On 390px screens, proof chips collapse into two columns, feature layouts become single-column, and secondary decoration is removed before content shrinks.

Corners are stepped using `clip-path` on decorative panels and 2–4px radii on controls. Cards appear only for independent findings or plans. A fine pixel-grid background is low contrast and purely decorative.

## Interaction grammar

- **Scan:** a single horizontal highlight moves once across the hero or field when analysis begins.
- **Lock:** the current review field receives an amber left rail and the real page field receives a thick amber outline.
- **Advance:** next/previous controls update the field counter and move focus back to the review panel; arrow keys mirror the controls.
- **Resolve:** acknowledged findings dim and display `CHECKED`; no content is auto-corrected.
- **Speak:** cyan waveform pixels indicate browser text-to-speech. Speech is always initiated by the user and can be stopped immediately.
- **Blocked domain:** coral `PAUSED` status explains why and offers a one-site enable action. Password values are never read or analysed, even when a site is enabled.

## Motion policy

UI transitions last 160–220ms and animate only opacity or transform. The hero scan line runs once on load and never flashes. Review panel entry originates from the extension toolbar side; finding changes cross-fade. Under `prefers-reduced-motion: reduce`, all movement and smooth scrolling become instant, the scan line is hidden, and state changes retain their borders, icons, labels, and live-region announcements.

## Original asset plan and provenance

### Hero: `assets/hero-form-checkpoint`

- Use case: `stylized-concept`
- Subject: an isometric, abstract web form travelling through a private inspection checkpoint; swapped letter tiles and a duplicate word are caught by amber brackets while clean fields exit in lime.
- World/materials: dark pixel-art demoscene console, crisp block geometry, subtle CRT phosphor grain, no people.
- Light/lens: orthographic/isometric, edge lighting, generous dark negative space, readable at small sizes.
- Palette words: midnight navy, warm paper, scan lime, signal amber, relay cyan, coral used sparingly.
- Negative list: text, letters, words, logos, brands, watermark, shields, padlocks, brains, medical symbols, glossy generic 3D, photorealism, neon gradient fog.
- Prompt: “Use case: stylized-concept. Asset type: responsive landing-page hero illustration. An abstract web form made of warm off-white pixel tiles passes through a compact local inspection checkpoint; two adjacent blank glyph tiles are visibly swapped and caught between amber bracket markers, a repeated pair of blank word bars is flagged, and clean field rows exit with small lime check pixels. Dark pixel-art demoscene console world, orthographic isometric view, crisp block geometry, restrained CRT phosphor grain, edge lighting, midnight navy background with generous negative space, warm paper, scan lime, signal amber, relay cyan, sparing coral. No people. No readable text, no letters, no numbers, no logos, no brands, no watermark, no shields, no padlocks, no brains, no medical symbols, no glossy generic 3D, no photorealism, no gradient fog.”
- Generator: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`.
- License/provenance: generated specifically for Form Guard on 2026-08-27; original project asset. Source PNG and prompt sidecar are retained in `assets/src/`; optimised WebP is shipped.

Hand-authored interface icons and the product mark are inline SVG/pixel geometry created for this repository under the project MIT license. No stock art, icon library, third-party runtime assets, or external fonts are used.

`public/assets/form-guard-social.png` is a 1200 × 630 crop derived from the reviewed generated hero above for route social cards. `public/apple-touch-icon.png` is a 180 × 180 export of the hand-authored product mark. Both are project-owned derivatives and introduce no third-party asset or network dependency.
