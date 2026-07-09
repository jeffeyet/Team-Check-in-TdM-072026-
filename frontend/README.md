# Frontend — Check-In Portal SPA

React 18 + TypeScript + Vite single-page app for the AI Leadership Intensive
portal: Day 1 team check-in, Day 2 prompt-log submission, and the passcode-gated
instructor dashboard. Data is **isolated per cohort**: student views are scoped
to the group in the `?grupo=<id>` link, and the instructor manages groups from
the dashboard.

Root docs and the full API tables are in [`../README.md`](../README.md); the
team's Spanish planning docs are in [`../docs`](../docs/README.md).

## Structure (`src/`)

| Path              | Purpose |
|-------------------|---------|
| `main.tsx`        | React entry point (mounts `App`) |
| `App.tsx`         | Reads `?grupo=<id>`, verifies the cohort (`getCohort`), and routes: student views require a live cohort or show the group-code gate; the header switch toggles the instructor view. Default student view `day2` |
| `views/Day1.tsx`  | Day 1 team check-in form (writes to its cohort) |
| `views/Day2.tsx`  | Day 2 prompt-log form; team-name autocomplete from the cohort's Day 1 names |
| `views/Admin.tsx` | Instructor dashboard: passcode gate, create/list/archive cohorts, per-cohort share link (copy), cohort detail with Teams/Prompts tabs, CSV export, single-submission delete, legacy import, JSON backup |
| `api.ts`          | Typed fetch client for `/api/c` (student) and `/api/admin` (instructor) |
| `ui.tsx`          | Shared UI: Header, DayTabs, GroupGate, ConfirmScreen, LoadingScreen |
| `types.ts`        | Shared view/data types (`View`, `AdminTab`, `Team`, `PromptLog`, `Cohort`) |
| `styles.css`      | Styles |
| `../index.html`   | Vite HTML entry |
| `../vite.config.ts` | Vite config; dev server on :5173, proxies `/api` → `:3000` |

## Access model

- **Students** open a group link: `/?grupo=<id>`. `App.tsx` verifies the cohort;
  if the id is missing, unknown, or archived, it shows `GroupGate` to enter the
  group code. All student calls hit the cohort-scoped `/api/c/:cohort/*` routes.
- **Instructor** enters the single passcode in the dashboard gate. `api.ts`
  sends it in the **`X-Passcode`** header on every admin call — never in a query
  string. Downloads (CSV exports, `backup.json`) go through `fetch` + blob so the
  passcode stays out of the URL and browser history (`downloadBlob` in
  `api.ts`). `shareLink(id)` builds the `/?grupo=<id>` link the instructor
  copies for each group.

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
`npm run dev:backend` from the root so `/api` proxies to the backend.
