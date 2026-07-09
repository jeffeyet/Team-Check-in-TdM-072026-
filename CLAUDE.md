# CLAUDE.md — Team Solanum working notes

Context for Claude Code sessions working in this repo. Human teammates: read
`README.md` first.

## What this is

TypeScript + React portal for the Berkeley Innovation Group AI Leadership
Intensive: Day 1 team check-in, Day 2 prompt-log submission, passcode-gated
instructor dashboard. Storage is the Replit key-value DB (`team:*` and
`prompt:*` keys). Full description and API table: `README.md`.

The modern stack **is the repo root now** — an exact-parity rewrite of the
earlier single-file app (same `/api` routes, error messages, status codes,
limits, dedupe, and CSV). See ADR-0003. The old single-file app lives only in
git history (`git checkout 37760a9 -- index.js public`).

## Branch policy (important)

- **Work on `Solanum_Branch` only.** Never commit or push to `main` — `main`
  belongs to the instructor's upstream repo (`jeffeyet/Team-Check-in-TdM-072026-`).
- Before starting: `git checkout Solanum_Branch && git pull`.
- Commit messages: short imperative subject, e.g. `Split Day 2 routes into prompts router`.

## Layout & commands

- `backend/` — Express + TypeScript API (CommonJS, compiled with `tsc`).
  `src/index.ts` boots the server, mounts both routers under `/api`, and serves
  `frontend/dist` with an SPA fallback. `src/config.ts` (PASSCODE, PORT),
  `src/db.ts` (`@replit/database` wrapper), `src/auth.ts` (timing-safe check),
  `src/lib/`, `src/services/`, `src/routes/`. See `backend/README.md`.
- `frontend/` — React 18 + TypeScript + Vite SPA. `src/App.tsx` is a
  state-based router (default view `day2`); `src/views/` holds Day1/Day2/Admin;
  `src/api.ts` is the typed fetch client; `src/styles.css` is ported verbatim.
  See `frontend/README.md`.
- `docs/` — team docs in Spanish: requirements, change control, ADRs, tests,
  ops. Start at `docs/README.md`.
- Commands (run from the root):
  - `npm run install:all` — install backend + frontend deps.
  - `npm run build` — `vite build` then `tsc` (frontend/dist + backend/dist).
  - `npm start` — `node backend/dist/index.js` → http://localhost:3000.
  - `npm run dev:backend` — API with `tsx watch` on :3000.
  - `npm run dev:frontend` — Vite on :5173, proxies `/api` → :3000.
  - `npm run typecheck` — `tsc --noEmit` (backend).

## Known quirks (verified July 2026)

1. **DB writes fail outside Replit.** `@replit/database` needs `REPLIT_DB_URL`,
   which only exists in a Replit workspace. Locally the UI loads and
   `/api/teamnames` returns `{"names":[]}`, but `/api/submit` returns
   `{"error":"Save failed."}`. Do not chase this as a bug; test real
   reads/writes on Replit.
2. Instructor passcode is `process.env.PASSCODE || "roster2026"`, checked per
   request via query param or JSON body (`code`). There is no session state.
3. The SPA defaults to `day2`. `App.tsx` switches `view` between
   `day1`/`day2`/`admin`; the admin dashboard defaults to the `prompts` tab.

## Docs & process (docs/, in Spanish)

- **Scope changes go through a change request first**: add a `CC-###` in
  `docs/cambios/` (template + registro there) before touching code, and
  reference the CC id in commit messages.
- Requirements live in `docs/requerimientos/` (RF/RNF/RES). The current
  content is the implemented baseline, each item citing `file:lines`; new
  features enter as `propuesto` via a CC. Keep them in sync with code.
- Durable technical decisions get an ADR in `docs/decisiones/`. Current
  direction: ADR-0003 — modern stack (TypeScript + Express, React + Vite, one
  Replit service, Replit KV kept), done as an in-place rewrite at the repo
  root. It supersedes ADR-0002 (evolve the single-file app in place, no build
  step), which superseded ADR-0001 (separate front/back + PostgreSQL).
- Before deploying, run `docs/pruebas/checklist-humo.md` end to end.

## Style

- TypeScript throughout. Backend is CommonJS (compiled by `tsc`); frontend is
  ES modules + React function components bundled by Vite.
- Match the existing terse style; keep user-facing strings identical (UI-string
  parity with the original app is a hard requirement).
- API responses follow the existing shape: `{ok: true}` or `{error: "..."}`.
