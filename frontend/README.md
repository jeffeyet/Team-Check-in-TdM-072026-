# Frontend — Check-In Portal SPA

React 18 + TypeScript + Vite single-page app for the AI Leadership Intensive
portal: Day 1 team check-in, Day 2 prompt-log submission, and the passcode-gated
instructor dashboard. The UI is an exact parity rewrite of the original app
(same strings, layout, and flows); `src/styles.css` is ported verbatim.

Root docs and the full API table are in [`../README.md`](../README.md); the
team's Spanish planning docs are in [`../docs`](../docs/README.md).

## Structure (`src/`)

| Path              | Purpose |
|-------------------|---------|
| `main.tsx`        | React entry point (mounts `App`) |
| `App.tsx`         | State-based router; switches `day1` / `day2` / `admin` (default `day2`) |
| `views/Day1.tsx`  | Day 1 team check-in form |
| `views/Day2.tsx`  | Day 2 prompt-log form (team-name autocomplete) |
| `views/Admin.tsx` | Passcode-gated dashboard (stats, cards, CSV, clear) |
| `api.ts`          | Typed fetch client for the `/api` routes |
| `ui.tsx`          | Shared UI: Header, DayTabs, ConfirmScreen, keyboard helpers |
| `types.ts`        | Shared view/data types |
| `styles.css`      | Styles, ported verbatim from the original |
| `../index.html`   | Vite HTML entry |
| `../vite.config.ts` | Vite config; dev server proxies `/api` → `:3000` |

## Commands

Run from this directory:

| Command           | What it does |
|-------------------|--------------|
| `npm run dev`     | Vite dev server on http://localhost:5173 (proxies `/api` → :3000) |
| `npm run build`   | `vite build` → `dist/` |
| `npm run preview` | Serve the production build locally for a quick check |

## Production

In production there is a single service: the backend serves the built
`frontend/dist` and falls back to the SPA entry for non-`/api` routes. Build the
frontend before starting the backend (the root `npm run build` does both). For
local development, prefer running the Vite dev server (`npm run dev`) alongside
`npm run dev:backend` from the root.
