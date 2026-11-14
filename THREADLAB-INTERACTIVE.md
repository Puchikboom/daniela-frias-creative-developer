# ThreadLab Interactive — original garment configurator

Independent, fictional portfolio experience. No employer code, images, specifications, customer data, or intellectual property are used.

## Live implementation

An original bilingual Astro page (`/en/threadlab/`, `/es/threadlab/`) embeds an SVG-based garment configurator with:

- Fabric selection (cotton, canvas, linen) changing the SVG texture.
- Five colourways and three fits with actual silhouette changes.
- User-generated, sanitized three-character monogram.
- Technical drafting grid toggle.
- Browser-local configuration persistence and reset.
- Reproducible shareable URL query strings.
- SVG vector export (created locally; no server upload).
- Keyboard-accessible native radio groups, text field, checkbox and action buttons.
- Reduced-motion media-query support, responsive layout, original visual direction.

**Truthful scope:** 2D SVG configurator. No 3D geometry, purchasing, manufacturing, checkout or payment integration is claimed. Prices are fictional.

## Architecture

- `src/templates/ThreadLabInteractive.astro`: bilingual semantic markup and styling.
- `public/threadlab/model.js`: pure configuration schema, validation, computed presentation and URL round-trip.
- `public/threadlab/configurator.js`: DOM bindings, controls, SVG drawing, localStorage, share and export.
- `tests/threadlab.test.mjs`: Node native tests of combinations, invalid inputs and URL round trips.

## Run and validate

```bash
npm ci
node --test tests/threadlab.test.mjs
npm run build
npm run preview
```

Automated Chromium smoke tests now exercise both English and Spanish at desktop/mobile widths, fabric, colour, fit, monogram, reset, reload persistence, grid, SVG export, deep links, keyboard radio selection, and horizontal overflow checks. Screenshots are retained as CI artifacts. This does **not** constitute a full WCAG audit or cross-browser certification.

## CV / case study language (after publishing and reviewing)

"Built an independent bilingual garment configurator with Astro, JavaScript and SVG, featuring reactive fabric and fit customization, shareable application state, local persistence, vector export and automated configuration tests."

Do not claim React, 3D or production e-commerce for this implementation.
