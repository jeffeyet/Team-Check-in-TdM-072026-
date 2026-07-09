# Backend — Check-In Portal API

Express 4 + TypeScript (CommonJS, compiled with `tsc` → `dist/`) API for the
AI Leadership Intensive portal. It exposes the Day 1, Day 2, and admin routes
under `/api`, and in production serves the built frontend from
`../frontend/dist` with an SPA fallback. Behavior is an exact parity rewrite of
the original single-file app: same routes, error messages, status codes,
limits, dedupe, and CSV output.

Root docs and the full API table are in [`../README.md`](../README.md); the
team's Spanish planning docs are in [`../docs`](../docs/README.md).

## Structure (`src/`)

| Path              | Purpose |
|-------------------|---------|
| `index.ts`        | Startup: mounts routers under `/api`, serves `frontend/dist`, SPA fallback |
| `config.ts`       | `PASSCODE`, `PORT` from env |
| `db.ts`           | Wrapper around `@replit/database` (keys `team:*`, `prompt:*`) |
| `auth.ts`         | `checkCode` — timing-safe SHA-256 passcode check |
| `types.ts`        | Shared request/record types |
| `lib/csv.ts`      | CSV serialization helper |
| `lib/respond.ts`  | Consistent JSON response helpers |
| `services/teams.ts`   | Day 1 storage + business logic |
| `services/prompts.ts` | Day 2 storage + business logic |
| `routes/teams.ts`     | `/submit`, `/teamnames`, `/roster`, `/export.csv`, `/clear` |
| `routes/prompts.ts`   | `/prompt-submit`, `/prompt-roster`, `/prompt-export.csv`, `/prompt-clear` |

## Commands

Run from this directory (or via the root orchestrator, e.g. `npm run build`):

| Command             | What it does |
|---------------------|--------------|
| `npm run build`     | `tsc` → `dist/` |
| `npm start`         | `node dist/index.js` → http://localhost:3000 |
| `npm run dev`       | `tsx watch src/index.ts` (hot reload) |
| `npm run typecheck` | `tsc --noEmit` |

## Configuration

| Variable        | Default      | Purpose |
|-----------------|--------------|---------|
| `PASSCODE`      | `roster2026` | Instructor passcode (query param or JSON body `code`) |
| `PORT`          | `3000`       | HTTP port |
| `REPLIT_DB_URL` | —            | Key-value DB endpoint; injected automatically by Replit |

**Note (verified):** `@replit/database` needs `REPLIT_DB_URL`, which only
exists inside a Replit workspace. Outside Replit the server starts and serves
the UI, but every DB operation fails (`Save failed.`). Test real reads/writes
on Replit.
