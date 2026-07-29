# MotoHub Agent Notes

- Reuse the existing React/Vite/TypeScript architecture before adding new files or abstractions.
- Keep MotoHub as a static-first PWA until backend, auth, payments, calendar, or notifications are explicitly requested.
- Store app content in `src/data`; keep page components focused on rendering existing data models.
- Prefer small, targeted edits. Do not rewrite working screens, styles, or data models unless the task requires it.
- Do not commit, push, reset, or reinstall dependencies unless the user asks.

## Key Folders

- `src/data` — sections, categories, places, guides, routes, events, skills, home content.
- `src/pages` — route-level screens and details pages.
- `src/features/search` — local search indexing and result routing.
- `src/shared` — layout, i18n, storage, reusable UI.
- `src/styles/globals.css` — global visual system and responsive styles.
- `public/assets` — static images, icons, and PWA assets.

## Commands

- `npm run dev` — start local PWA development server.
- `npm run typecheck` — TypeScript project check.
- `npm run build` — TypeScript and production build.
- `npm run test` — local search/content and backend seed/RLS smoke checks.
- `npm run i18n:check` — translation key check.
- `npm run supabase:test:smoke` — staging-safe public Supabase smoke check.
- `node scripts/export-content-seed.mjs` — regenerate Supabase seed from current static content.
