# Daniela Frías — Creative Developer Portfolio

## What's included

- Responsive Astro website with real media for all 6 projects: Lunaria, ThreadLab, Synova, VineWinner, Herb Agency and ShuttleFlow.
- Two languages: Spanish (`/es/`) and English (`/en/`).
- Dedicated project pages, About, JavaScript Playground and Contact.
- New animated editorial homepage featuring *real project work*, kinetic type, pointer-driven collage and motion-reduction support.
- Links to the existing historical Wix portfolios.
- Clear distinction between **confirmed** and **suggested** technical stacks on every project page.

## Run locally

From your Downloads folder:

```bash
unzip daniela-creative-developer-release.zip -d daniela-release
cd daniela-release/daniela-creative-developer-v1
npm install
npm run dev
```

Open the URL displayed by Astro and append `/es/` or `/en/` (usually `http://127.0.0.1:4321/es/`). **Do not run npm from `~`**; `package.json` lives inside the project folder.

## Production

```bash
npm run build
npm run preview
```

Deploy the `dist` folder to Cloudflare Pages or Netlify. On Cloudflare Pages: build command `npm run build`, output directory `dist`. Keep an Astro project root pointing to this folder. Use Node 20.3+ / 22 if needed for Astro 5.

## Accuracy / publication checklist

- Confirm real technology stacks for VineWinner, Herb Agency and ShuttleFlow; they are currently labeled as unverified.
- Lunaria and ThreadLab: Astro confirmed. Synova: SvelteKit confirmed.
- The images of the 3D configurator, ecommerce assistant and dashboards are project showcase materials; their operational status has **not** been verified. Avoid claiming they are live implementations without evidence.
- Replace or confirm historical Wix URLs and email address before publication.
- Check image ownership/permissions where third-party stock or generated visuals were used in case-study artwork.
- Review pages on narrow mobile screens (320–390 px), tablet and desktop. Check menu and language toggle.
- Test video playback and image payloads on mobile connections (the source package is large due to original videos).
- Install dependencies and complete a production build: the current authoring environment could not fetch npm packages, so a successful Astro build is **not** claimed.

## URLs

`/es/`, `/en/`, `/es/work/`, `/en/work/`, `/es/playground/`, `/en/playground/`, `/es/about/`, `/en/about/`, `/es/contact/`, `/en/contact/`, and `/es/work/{slug}/`, `/en/work/{slug}/` for every project.
