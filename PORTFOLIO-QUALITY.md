# Portfolio QA and publication checklist — November 2026

## Scope and truthfulness

This is an original bilingual portfolio in Astro, with independently developed React / TypeScript applications and a locally tested PHP / SQLite / WordPress engineering practice. **The work is separate from confidential employment material.**

The CI suite tests the **built output** hosted by a local HTTP server. This is strong evidence that the repository compiles and routes work locally; it is **not confirmation that Cloudflare Pages has deployed the newest commit**.

## Quality verification

1. **Responsive screenshot coverage:** Chromium renders important portfolio pages at 390px (mobile), 768px (tablet) and 1440px (desktop). Real captured PNGs are saved as GitHub Actions job artifacts under `qa-artifacts/portfolio/`.
2. **Navigation:** built page links are checked for expected internal routes. Canonical metadata and English/Spanish descriptions are checked.
3. **Browser behavior:** existing Playwright suites verify Playground experiments, ThreadLab, Pulse Studio and React API Studio, including real user actions.
4. **Accessibility:** automated axe-core WCAG 2.1 A/AA scans check key interfaces; the new contact section is checked separately in English and Spanish. Automation cannot prove full WCAG conformance or replace screen-reader testing.
5. **Performance diagnostics:** local Chromium navigation timing is recorded in `qa-artifacts/portfolio/report.json`. It is **not** CrUX field data, Core Web Vitals, or a Lighthouse score. For production performance reporting, run Lighthouse on the publicly reachable Cloudflare URL in representative mobile/desktop contexts and save the exact date, profile, tool version and raw report. Do not claim performance scores from mock measurements.
6. **SEO:** canonical URLs, bilingual alternates, Open Graph / Twitter metadata and robots directives are generated in the shared layout; `sitemap.xml` and `robots.txt` are generated from the final built routes.
7. **Recruitment contact:** a bilingual availability/contact section links to email, code, work samples and engineering evidence. It uses no lead form or visitor tracking.

## Architecture: how the independent labs are hosted

```text
            CLOUDFLARE PAGES / STATIC ASTRO OUTPUT
                    /en  ·  /es
             /playground/ · /engineering/
                         |
    +--------------------+-------------------+
    |                    |                   |
   ThreadLab           Pulse Studio     React API Studio
   SVG + JS           React/TS demo     React/TS + fetch
   browser-local      browser-local     same-origin JSON
   no backend         fake CRUD         simulated errors
                         |
                   Separate local tests (not deployed)
                   PHP 8 ↔ PDO SQLite
                   WordPress ↔ MySQL
```

## Real artifacts and technical case studies

- [Quality workflow and captured screenshots](https://github.com/Puchikboom/daniela-frias-creative-developer/actions)
- [Pulse Studio typed analytics](labs/pulse-studio/src/analytics.ts) and [dashboard browser tests](tests/pulse-studio.browser.mjs)
- [PHP integration tests](labs/pulse-studio/tests/test_api.py)
- [Forma Studio WordPress integration tests](labs/forma-studio/tests/wordpress-integration.sh)
- [ThreadLab browser and automated accessibility tests](tests/threadlab.browser.mjs)
- [Playground Data Lab tests](tests/data-lab.browser.mjs)
- [React API Studio real-fetch tests](tests/react-api-studio.browser.mjs)

**Do not substitute generated mockups for actual application screenshots.** Use the retained Chromium artifacts from a successful run. If artifact retention expires, rerun the workflow.

## Explicit outstanding manual checks

- Open the production Cloudflare pages and verify their rendered build matches `main`; remote fetches were unavailable from this environment.
- Inspect retained screenshots side-by-side for clipping, rhythm, layout consistency and actual project visuals.
- Test keyboard and screen readers manually with an assistive-technology setup.
- Record genuine production Lighthouse reports / real-user CWV, if available, before publishing numeric performance claims.
- Verify outgoing links and contact email in the deployed site.
