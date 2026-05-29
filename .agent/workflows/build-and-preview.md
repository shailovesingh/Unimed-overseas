---
description: Build the Unimed Overseas static site from Markdown and preview locally
---

# Build & Preview — Unimed Overseas

## Prerequisites
- Node.js 18+ installed

## Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile all Markdown pages (`index.md`, `about.md`, `contact.md`, `destinations/*.md`) into `dist/`:
   ```bash
   npm run build
   ```

3. Preview the production build:
   ```bash
   npm run preview
   ```
   Open http://localhost:3000 — the homepage shows the welcome enquiry modal on first visit (`show_welcome_dialog: true` in `index.md`).

## Edit content
- Update copy in root and `destinations/` Markdown files, then re-run `npm run build`.
- Global theme, destinations list, and phone codes: `site.config.json`.
- Enquiry modal fields mirror `enquiry.md`.

## Deploy
Push to `main`/`master` to trigger GitHub Pages via `.github/workflows/deploy.yml`, or upload the `dist/` folder to any static host.
