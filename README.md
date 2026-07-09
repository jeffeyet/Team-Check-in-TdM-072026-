# Team Check-In Portal — AI Leadership Intensive

A small web portal for the Berkeley Innovation Group **AI Leadership Intensive**.
Each student team logs its name, members (with LinkedIn), first PM, and a
one-sentence idea (Day 1), then submits a prompt-log Google Doc and a revised
idea (Day 2). Instructors open a passcode-gated roster with per-team cards and
CSV export.

Team **Solanum** collaborates on the `Solanum_Branch` branch — see
[Team workflow](#team-workflow) below.

## What it does

- **Day 1 — Team Check-In:** one member per team submits the team name, up to
  six members (one marked as first PM, LinkedIn optional), and a one-sentence
  idea.
- **Day 2 — Prompt Log:** a team submits a Google Doc link with its 20-prompt
  session and a revised one-sentence idea. The team-name field autocompletes
  from Day 1 check-ins.
- **Instructor view:** passcode-gated dashboard with stats, per-team cards,
  CSV export, and a clear-all action for each day.

## Tech stack

| Layer    | Choice |
|----------|--------|
| Backend  | Node.js + Express 4 + TypeScript (`backend/`, CommonJS, compiled with `tsc` → `dist/`) |
| Frontend | React 18 + TypeScript + Vite SPA (`frontend/`, built to `frontend/dist/`) |
| Storage  | Replit key-value database (`@replit/database`) — keys `team:*` and `prompt:*` |
| Hosting  | Replit Autoscale deployment, one service (backend serves the built frontend) |

The behavior is an exact parity rewrite of the earlier single-file app: same
`/api` routes, same error messages, same status codes, same character limits,
same dedupe, same CSV output (verified with the smoke test). What changed is
where the code lives, not what the system does.

## Repository layout

```
backend/            Express + TypeScript API (see backend/README.md)
  src/index.ts        Startup; serves frontend/dist + SPA fallback
  src/config.ts       PASSCODE, PORT
  src/db.ts           @replit/database wrapper
  src/auth.ts         checkCode (timing-safe SHA-256)
  src/types.ts        Shared types
  src/lib/            csv.ts, respond.ts helpers
  src/services/       teams.ts, prompts.ts (storage + business logic)
  src/routes/         teams.ts, prompts.ts (API endpoints)
frontend/           React + TypeScript + Vite SPA (see frontend/README.md)
  src/App.tsx         State-based router (default view 'day2')
  src/api.ts          Typed fetch client
  src/ui.tsx          Header, DayTabs, ConfirmScreen, keyboard helpers
  src/views/          Day1.tsx, Day2.tsx, Admin.tsx
  src/styles.css      CSS ported verbatim from the original
package.json        Root orchestrator: install:all, build, start, dev, typecheck
.replit             Replit run/deploy config (one service)
docs/               Team docs, in Spanish: requirements (RF/RNF/RES), change
                    control (CC), ADRs, smoke-test checklist, ops runbook —
                    start at docs/README.md
CLAUDE.md           Context file for Claude Code sessions
```

## Run locally

Install both workspaces once:

```bash
npm run install:all     # installs backend/ and frontend/ deps
```

### Option A — two dev servers (hot reload)

```bash
npm run dev:backend     # API on http://localhost:3000 (tsx watch)
npm run dev:frontend    # Vite on http://localhost:5173, proxies /api → :3000
```

Open http://localhost:5173. The Vite dev server proxies `/api` calls to the
backend on port 3000.

### Option B — production-style build

```bash
npm run build           # vite build (frontend/dist) + tsc (backend/dist)
npm start               # node backend/dist/index.js → http://localhost:3000
```

In this mode the backend serves the built frontend from `frontend/dist` and
falls back to the SPA entry for non-`/api` routes.

**Heads-up (verified):** outside Replit the server starts and serves the UI,
but every database operation fails (submissions return `Save failed.`),
because `@replit/database` needs the `REPLIT_DB_URL` that only exists inside a
Replit workspace. Local runs are fine for UI and route work; to exercise real
reads/writes, run the repl on Replit (or copy a `REPLIT_DB_URL` secret from
one into your local env).

## Deploy on Replit

1. Import the repo: **Create App → Import from GitHub**.
2. Press **Run** to test. `.replit` runs
   `npm run install:all && npm run build && npm run start` as a single service.
3. Use **Deploy → Autoscale** for a public URL.

## Configuration

| Variable        | Default      | Purpose |
|-----------------|--------------|---------|
| `PASSCODE`      | `roster2026` | Instructor passcode (set as a Secret in Replit: Tools → Secrets) |
| `PORT`          | `3000`       | HTTP port |
| `REPLIT_DB_URL` | —            | Key-value DB endpoint; **injected automatically by Replit**, not set by hand |

## API reference

Request bodies are JSON. Responses are JSON too, except the two `*.csv` export
routes, which return `text/csv` (and a plain-text `Unauthorized` on a bad
passcode). `code` is the instructor passcode, accepted as a query param or in
the JSON body. Routes are unchanged from the original app (parity).

| Method | Route                    | Auth   | Purpose |
|--------|--------------------------|--------|---------|
| POST   | `/api/submit`            | —      | Day 1 check-in `{teamName, members[], idea}` |
| GET    | `/api/teamnames`         | —      | Public sorted team-name list (powers Day 2 autocomplete) |
| GET    | `/api/roster?code=`      | 🔒     | Deduped team list (latest entry per team name) |
| GET    | `/api/export.csv?code=`  | 🔒     | Day 1 CSV, one row per member |
| POST   | `/api/clear`             | 🔒     | Delete all `team:*` records |
| POST   | `/api/prompt-submit`     | —      | Day 2 log `{teamName, idea, docUrl}` |
| GET    | `/api/prompt-roster?code=` | 🔒   | All prompt logs, grouped client-side by team |
| GET    | `/api/prompt-export.csv?code=` | 🔒 | Day 2 CSV |
| POST   | `/api/prompt-clear`      | 🔒     | Delete all `prompt:*` records |

## Previous single-file version

The earlier app was a single Express file (`index.js`) plus one static
`public/index.html`. It is preserved in git history at commit `37760a9`. To
restore those files into the working tree:

```bash
git checkout 37760a9 -- index.js public
```

The current stack (this repo root) is a parity rewrite adopted in
[ADR-0003](docs/decisiones/0003-stack-moderno-typescript-react.md).

## Team workflow

- All team work happens on **`Solanum_Branch`** — never commit directly to `main`.
- Read [`CLAUDE.md`](CLAUDE.md) (Claude Code loads it automatically) before
  making changes with an AI pair.
- Requirements, change control, ADRs, and the smoke-test checklist live in
  [`docs/`](docs/README.md). Scope changes go through a change request (CC)
  before code; run the smoke checklist before deploying.
