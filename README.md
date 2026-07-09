# Team Check-In Portal — AI Leadership Intensive

A small web portal for the Berkeley Innovation Group **AI Leadership Intensive**.
Each student team logs its name, members (with LinkedIn), first PM, and a
one-sentence idea (Day 1), then submits a prompt-log Google Doc and a revised
idea (Day 2). Instructors open a passcode-gated dashboard with per-team cards
and CSV export.

Data is **isolated per cohort** (one group / edition per box): the instructor
creates a group, shares its link, and each group's submissions stay separate
from every other group's.

Team **Solanum** collaborates on the `Solanum_Branch` branch — see
[Team workflow](#team-workflow) below.

## What it does

- **Day 1 — Team Check-In:** one member per team submits the team name, up to
  six members (one marked as first PM, LinkedIn optional), and a one-sentence
  idea.
- **Day 2 — Prompt Log:** a team submits a Google Doc link with its prompt
  session and a revised one-sentence idea. The team-name field autocompletes
  from that cohort's Day 1 check-ins.
- **Instructor dashboard:** passcode-gated. Create and archive groups, open a
  group to see stats and per-team cards, export CSV, delete an individual
  submission, and download a full JSON backup.

Access model: **one instructor passcode** (the professor is the only admin);
student isolation is by the cohort they write to (the group link). There are no
student accounts.

## Tech stack

| Layer    | Choice |
|----------|--------|
| Backend  | Node.js + Express 4 + TypeScript (`backend/`, CommonJS, compiled with `tsc` → `dist/`) |
| Frontend | React 18 + TypeScript + Vite SPA (`frontend/`, built to `frontend/dist/`) |
| Storage  | Replit key-value database (`@replit/database`) — cohort index in the `cohorts` key; per-cohort data under `cohort:<id>:team:*` and `cohort:<id>:prompt:*` |
| Hosting  | Replit Autoscale deployment, one service (backend serves the built frontend) |

## Repository layout

```
backend/            Express + TypeScript API (see backend/README.md)
  src/index.ts        Startup; mounts /api/c + /api/admin; serves frontend/dist
  src/config.ts       PASSCODE (fail-closed in prod), PORT
  src/db.ts           @replit/database wrapper (get/set/list/del)
  src/auth.ts         requirePasscode / requirePasscodeText (X-Passcode, timing-safe)
  src/types.ts        Shared types (Team, PromptLog, Cohort)
  src/lib/            csv.ts, respond.ts helpers
  src/services/       cohorts.ts, teams.ts, prompts.ts (storage + business logic)
  src/routes/         student.ts (/api/c), admin.ts (/api/admin)
frontend/           React + TypeScript + Vite SPA (see frontend/README.md)
  src/App.tsx         Reads ?grupo=<id>, verifies the cohort, routes the views
  src/api.ts          Typed fetch client (centralizes X-Passcode + blob downloads)
  src/ui.tsx          Header, DayTabs, GroupGate, ConfirmScreen, LoadingScreen
  src/views/          Day1.tsx, Day2.tsx, Admin.tsx
  src/styles.css      Styles
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
but every database operation fails (submissions return `Save failed.`, lists
come back empty), because `@replit/database` needs the `REPLIT_DB_URL` that
only exists inside a Replit workspace. The handlers catch these errors and
respond `500` / empty lists rather than crashing. Local runs are fine for UI
and route work; to exercise real reads/writes, run the repl on Replit (or copy
a `REPLIT_DB_URL` secret into your local env).

## Deploy on Replit

1. Import the repo: **Create App → Import from GitHub**.
2. Set the **`PASSCODE`** secret (Tools → Secrets). **This is required in
   production:** with `NODE_ENV=production` or a Replit deployment and no
   `PASSCODE`, admin routes fail closed with `500 "Server passcode not
   configured."` (see [Configuration](#configuration)).
3. Press **Run** to test. `.replit` runs
   `npm run install:all && npm run build && npm run start` as a single service.
4. Use **Deploy → Autoscale** for a public URL.

## Configuration

| Variable            | Default          | Purpose |
|---------------------|------------------|---------|
| `PASSCODE`          | `roster2026` (dev only) | Instructor passcode. **Mandatory in production**; the dev default is used only outside production, with a startup warning. |
| `PORT`              | `3000`           | HTTP port |
| `NODE_ENV`          | —                | `production` triggers the fail-closed passcode posture |
| `REPLIT_DEPLOYMENT` | —                | Set by Replit on a deployment; also triggers fail-closed |
| `REPLIT_DB_URL`     | —                | Key-value DB endpoint; **injected automatically by Replit**, not set by hand |

## Typical instructor / student flow

1. **Instructor** opens the portal, clicks **Instructor view →**, and enters
   the passcode.
2. Creates a group (a **name**; the id/slug is derived automatically, or set a
   custom one).
3. Copies the group's **share link** (`/?grupo=<id>`) and sends it to that
   group's students.
4. **Students** open the link. The app validates the cohort and shows the Day 1
   / Day 2 forms scoped to that group. If the link is missing or the group is
   unknown/archived, students see a gate asking for their group code.
5. The instructor **opens** the group to see submissions, export CSV, delete an
   individual entry, or **archive** the group when it's over (a soft delete —
   data is kept). A full **JSON backup** is available for the whole store.

## API reference

Request/response bodies are JSON, except the two `*.csv` exports and
`backup.json`. The instructor passcode is sent in the **`X-Passcode`** header
(or `{code}` in the JSON body on POST) — **never** in a query string.

### Student routes (public, cohort-scoped) — mounted at `/api/c`

| Method | Route                             | Purpose |
|--------|-----------------------------------|---------|
| GET    | `/api/c/:cohort`                  | Resolve a group by id. `404 "Group not found."` if it is missing or archived; otherwise `{cohort:{id,label}}` |
| GET    | `/api/c/:cohort/teamnames`        | Unique, sorted team names for **this** cohort (powers Day 2 autocomplete). Never 401; returns `{names:[]}` on any error |
| POST   | `/api/c/:cohort/submit`           | Day 1 check-in `{teamName, members[], idea}`. `400` on missing fields, `404` if the group is missing/archived |
| POST   | `/api/c/:cohort/prompt-submit`    | Day 2 log `{teamName, idea, docUrl}`. `400` on missing fields, `404` if the group is missing/archived |

### Instructor routes (passcode-gated) — mounted at `/api/admin`

| Method | Route                                          | Purpose |
|--------|------------------------------------------------|---------|
| GET    | `/api/admin/cohorts`                           | Cohort index with per-cohort team/prompt counts |
| POST   | `/api/admin/cohorts`                           | Create a cohort `{label, id?}` (id defaults to a slug of the label). `409` if it already exists |
| PATCH  | `/api/admin/cohorts/:id`                        | Update `{label?, archived?}` |
| GET    | `/api/admin/cohorts/:id/roster`                | Deduped teams for the cohort (latest entry per team name, alphabetical) |
| GET    | `/api/admin/cohorts/:id/prompts`               | Prompt logs for the cohort (by team name, then time) |
| GET    | `/api/admin/cohorts/:id/export/teams.csv`      | Day 1 CSV, one row per member |
| GET    | `/api/admin/cohorts/:id/export/prompts.csv`    | Day 2 CSV |
| DELETE | `/api/admin/cohorts/:id/submissions/:key`      | Delete one submission by its storage key (verified to belong to the cohort) |
| POST   | `/api/admin/cohorts/:id/archive`               | Archive (soft delete): marks `archived:true`, keeps the data |
| POST   | `/api/admin/migrate-legacy`                     | `{cohortId}` — move legacy unprefixed `team:*`/`prompt:*` records into a cohort; returns `{moved}` |
| GET    | `/api/admin/backup.json`                        | Portable full backup: the cohort index plus every key/value |

Admin auth failures return `401 "Bad passcode."` (JSON routes) or `Unauthorized`
(CSV/text routes). If the passcode is not configured in production, admin routes
return `500 "Server passcode not configured."` instead.

## Data safety

There is **no destructive "clear all"**. Instead:

- **Archive** a cohort — a soft delete (`archived:true`) that hides it from
  students but keeps every record.
- **Delete a single submission** — removes one team or prompt entry by key.
- **Backup** — `GET /api/admin/backup.json` returns the entire store as JSON.
- **Migrate legacy data** — `POST /api/admin/migrate-legacy` moves old
  unprefixed records into a cohort, for adopting the cohort model without loss.

## Previous single-file version

The earliest app was a single Express file (`index.js`) plus one static
`public/index.html`, preserved in git history at commit `37760a9`. It was first
rewritten to this TypeScript + React stack as a parity rewrite
([ADR-0003](docs/decisiones/0003-stack-moderno-typescript-react.md)); cohort
isolation and the security hardening described above were added on top of that
rewrite. To restore the original files into the working tree:

```bash
git checkout 37760a9 -- index.js public
```

## Team workflow

- All team work happens on **`Solanum_Branch`** — never commit directly to `main`.
- Read [`CLAUDE.md`](CLAUDE.md) (Claude Code loads it automatically) before
  making changes with an AI pair.
- Requirements, change control, ADRs, and the smoke-test checklist live in
  [`docs/`](docs/README.md). Scope changes go through a change request (CC)
  before code; run the smoke checklist before deploying.
- **No AI feature** is integrated, by deliberate team decision; it would only be
  revisited for a genuinely creative use.
