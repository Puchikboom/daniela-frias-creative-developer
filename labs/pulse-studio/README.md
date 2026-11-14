# Pulse Studio · React + TypeScript + PHP engineering lab

An **original independent portfolio exercise**, made for Daniela Frías. The business, clients, budgets, and records are fictional. No content, code, client data, assets, internal logic, or designs from any employer have been used.

**Status:** independent engineering lab with a browser-only interactive demo at https://daniela-frias-creative-developer.pages.dev/pulse-studio/ . React/TypeScript builds, PHP/SQLite integration tests and desktop/mobile Chromium checks have passed. This is **not** production client work or a production-ready authenticated backend.

## Stack and what is implemented

- React 19 and TypeScript with typed data model
- Vite frontend with responsive, original editorial design
- Search, category and status filters, sorting, interactive analytics and CSV export
- TypeScript selector functions and metrics derived from filtered records
- CRUD (create/read/update/delete) calls against a PHP 8 API
- Server-side input validation and synthetic seed data
- Browser fetch loading/error state, accessible form labels and keyboard focus styles
- SQLite database via PDO and prepared statements (local API only)

## Safe static browser demo

A **separate** build uses only in-browser fictional data. No PHP endpoint is contacted.
CRUD changes persist in the browser's localStorage and can be cleared with `Reset demo data`.
This is the only version suitable for publishing as a static public demo.

```bash
cd labs/pulse-studio
npm install
npm run build:demo
```

Publish the **`dist/` output** to static hosting. No PHP files or writable database are deployed.
The regular `npm run build` continues to use the local PHP API.

## Run locally

Requires Node.js 20+ and PHP 8+. Open two terminals:

```bash
cd labs/pulse-studio/api
php -S 127.0.0.1:8000 router.php
```

```bash
cd labs/pulse-studio
npm install
npm run dev
```

Visit http://127.0.0.1:5173 . The Vite proxy forwards `/api` requests to the PHP server. The API requires the PHP `pdo_sqlite` extension and writes to `api/pulse.sqlite` by default.

## Automated API integration tests

The engineering workflow runs an actual PHP built-in server and exercises the local REST API with synthetic data. The test checks health, listing, create, update, delete, invalid progress/date, and missing-record responses. It uses a disposable SQLite database, protecting existing local data.

To run against a clean checkout with PHP and Python installed:

```bash
python3 -m unittest discover -s labs/pulse-studio/tests -p 'test_*.py' -v
```

This does **not** replace frontend browser tests, authentication testing, or a production security review.

## Verification commands

```bash
php -l api/router.php
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/projects
npm run build
```

**Security:** the local PHP API has no production-ready authentication, authorization or abuse protection. Automated browser checks test the public **browser-only** demo. PHP/SQLite SQL persistence and API CRUD integration tests are included, but are not sufficient for public writable hosting. **Never publish this PHP API with write access.** The public static demo uses fictitious browser-local records and never exposes a writable PHP endpoint.

## Engineering roadmap

1. Extend passing Chromium automated browser/accessibility checks with manual assistive-technology and cross-browser review.
2. Add tests (React Testing Library/Vitest; PHP endpoint integration tests).
3. Introduce versioned SQL migrations and a repository layer. SQLite and parameterized statements are implemented in the local API.
4. Build a protected sign-in flow, authorization, rate limiting, CSRF protection where cookie auth is used.
5. Add pagination and server-side filters, retry and empty/error states.
6. Verify static demo production deployment; only consider PHP hosting after security engineering. Cloudflare Pages cannot execute PHP.
7. Enrich the existing engineering case with authentic rendered screenshots and verified performance metrics.

## CV honesty

Until verified, label this as **Independent engineering project (in progress)**. It is not evidence of years of professional TypeScript, React or PHP experience.

## Suggested future portfolio program

- **WordPress plugin lab:** PHP 8, secure form processing, WP REST API, custom post types, ACF-like fields, SQL, PHPUnit, WP-CLI.
- **ThreadLab Interactive:** build a real product configurator with Astro + TypeScript + React, accessible controls and interaction tests.
- **Application engineering:** Next.js, API integration, authentication, database, testing, accessibility and performance.

The public static demo is included in the main Astro build; the PHP/SQLite backend remains local only.

## Architecture and engineering decisions (November 2026)

```text
PUBLIC (STATIC)
Cloudflare Pages → React + TypeScript → fictional localStorage CRUD

LOCAL ENGINEERING (NOT PUBLIC)
React + TypeScript → REST routes → PHP 8 → PDO SQLite (parameterized SQL)

GITHUB ACTIONS
TypeScript compilation / PHP syntax / disposable SQLite HTTP integration
Chromium desktop + mobile user flows / automated axe accessibility checks
```

**Why this architecture?** A browser-only demo allows recruiters to experience realistic interface interactions without deploying an unauthenticated public write API. The backend is developed and tested separately. No sensitive data is used.

**Inspect the evidence:** [CI runs](https://github.com/Puchikboom/daniela-frias-creative-developer/actions), [browser tests](https://github.com/Puchikboom/daniela-frias-creative-developer/blob/main/tests/pulse-studio.browser.mjs), [API tests](./tests/test_api.py), and [typed analytics](./src/analytics.ts).

**Remaining:** manual accessibility review, measured Core Web Vitals from real visits, secure production backend access controls and deeper component tests.
