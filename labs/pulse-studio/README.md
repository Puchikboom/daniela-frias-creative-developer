# Pulse Studio · React + TypeScript + PHP engineering lab

An **original independent portfolio exercise**, made for Daniela Frías. The business, clients, budgets, and records are fictional. No content, code, client data, assets, internal logic, or designs from any employer have been used.

**Status:** first engineering prototype. It has not yet passed a browser-level production build and is **not a public deployment**. Do not claim it as professional client work.

## Stack and what is implemented

- React 19 and TypeScript with typed data model
- Vite frontend with responsive, original editorial design
- Live project filtering and search
- Dashboard metrics derived from records
- CRUD (create/read/update/delete) calls against a PHP 8 API
- Server-side input validation and synthetic seed data
- Browser fetch loading/error state, accessible form labels and keyboard focus styles
- Local JSON file storage with file locking (for demonstration only)

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

Visit http://127.0.0.1:5173 . The Vite proxy forwards `/api` requests to the PHP server.

## Verification commands

```bash
php -l api/router.php
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/projects
npm run build
```

**Security:** no authentication, authorization, SQL persistence, automated API tests, session protection, or abuse protection yet. **Never publish this PHP API with write access.** For a public demo, build read-only demo mode or implement secure auth + proper database persistence and hosting before exposing writes.

## Engineering roadmap

1. Run full frontend build, test in a browser at desktop and mobile widths, fix discovered errors.
2. Add tests (React Testing Library/Vitest; PHP endpoint integration tests).
3. Replace JSON persistence with SQLite/PostgreSQL, migrations, repository layer and safe prepared statements.
4. Build a protected sign-in flow, authorization, rate limiting, CSRF protection where cookie auth is used.
5. Add pagination and server-side filters, retry and empty/error states.
6. Deploy frontend and secured backend on hosting that supports PHP (a static Cloudflare Pages project alone cannot execute PHP).
7. Publish a bilingual case study only when the demo, repository links, screenshots, technical decisions and test evidence are verified.

## CV honesty

Until verified, label this as **Independent engineering project (in progress)**. It is not evidence of years of professional TypeScript, React or PHP experience.

## Suggested future portfolio program

- **WordPress plugin lab:** PHP 8, secure form processing, WP REST API, custom post types, ACF-like fields, SQL, PHPUnit, WP-CLI.
- **ThreadLab Interactive:** build a real product configurator with Astro + TypeScript + React, accessible controls and interaction tests.
- **Application engineering:** Next.js, API integration, authentication, database, testing, accessibility and performance.

The live website on `main` is intentionally unchanged. This project lives only on the experimental branch.
