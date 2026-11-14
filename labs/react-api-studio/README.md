# Experiment 006 — React API Studio

An **original, independent** React 19 + TypeScript interactive demonstration for Daniela Frías's editorial Playground. All people, projects and numbers are fictional. No confidential employer information.

## What works

- Typed React state with `idle → loading → success / error` workflow
- A **real browser fetch** to the **same-origin static file** `catalog.json`
- AbortController cancellation and stale-response protection
- Optional simulated latency and failure to demonstrate resilience
- Retry, reset, client-side category filters and search
- Derived indicators and accessible error and loading feedback
- ES/EN, responsive dark-plum / cream / lime editorial interface
- Embedded in `/en/playground/` and `/es/playground/`, with standalone URL `/react-api-studio/?lang=en|es`

**Scope:** The dataset is a static read-only JSON asset, **not** a live PHP backend or REST server. Error injection and latency are simulations. This is a frontend engineering experiment, not client work. This distinction is shown in the interface.

## Build

From repository root: `npm run build` generates the isolated app using Vite and includes only the resulting static files under `/react-api-studio/`. The production Astro build does not deploy the source, Node modules, credentials, or any API server.

Standalone:

```bash
cd labs/react-api-studio
npm install
npm run build
```

## Quality checks

GitHub Actions checks compilation, browser behavior in English and Spanish, mobile overflow, failure/retry, simulated timing and automated axe WCAG 2.1 A/AA checks. These automated checks are not a complete accessibility audit.

## Portfolio claim

Once build and browser tests pass:

> Designed and built an independent React and TypeScript API interaction lab with typed asynchronous state, real same-origin fetch, request cancellation, failure/retry paths, derived data filtering, bilingual UI, and automated browser/accessibility checks.
