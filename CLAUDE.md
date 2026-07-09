# CLAUDE.md — Team Solanum working notes

Context for Claude Code sessions working in this repo. Human teammates: read
`README.md` first.

## What this is

TypeScript + React portal for the Berkeley Innovation Group AI Leadership
Intensive: Day 1 team check-in, Day 2 prompt-log submission, passcode-gated
instructor dashboard. **Data is isolated per cohort** (one group / edition per
box). Storage is the Replit key-value DB. Full description and API tables:
`README.md`.

The TypeScript + React stack **is the repo root**. It began as a parity rewrite
of the earlier single-file app (ADR-0003); cohort isolation and the security
hardening below were added afterward, so the app is no longer byte-for-byte
parity with the original. The old single-file app lives only in git history
(`git checkout 37760a9 -- index.js public`).

## Branch policy (important)

- **Work on `Solanum_Branch` only.** Never commit or push to `main` — `main`
  belongs to the instructor's upstream repo (`jeffeyet/Team-Check-in-TdM-072026-`).
- Before starting: `git checkout Solanum_Branch && git pull`.
- Commit messages: short imperative subject, e.g. `Split admin routes per cohort`.

## Cohort data model (the core concept)

- The cohort index is a single KV key, `cohorts` → a JSON array of `Cohort`
  `{id, label, createdAt, archived}` (`backend/src/types.ts`,
  `backend/src/services/cohorts.ts`).
- Per-cohort data lives under key prefixes: `cohort:<id>:team:*` and
  `cohort:<id>:prompt:*`. **Per-cohort data reads are always scoped by prefix**
  (no global `list()` sweep). Two admin ops are the intentional exception:
  `buildBackup` (`db.list("")`) and `migrateLegacy` (`db.list("team:")`/
  `db.list("prompt:")`).
- **Dedupe is per cohort** (`backend/src/services/teams.ts`): `dedupeTeams`
  runs over one cohort's already-scoped list, so teams with the same name in
  different cohorts no longer collide.
- Students reach a cohort via the `?grupo=<id>` link; the id is a slug derived
  from the label (`slugify` in `cohorts.ts`).
- **Id normalization is centralized.** The prefix helpers (`cohortPrefix`/
  `teamPrefix`/`promptPrefix`) and `updateCohort` all `slugify` the id, same as
  `getCohort`/`getActiveCohort` (CC-007). So every prefix read/delete/update
  accepts a non-canonical id (e.g. "Julio 2026") consistently; it's idempotent
  for canonical slugs. Writes still pass the resolved `cohort.id`.

## Layout & commands

- `backend/` — Express + TypeScript API (CommonJS, compiled with `tsc`).
  `src/index.ts` boots the server, mounts the student router at `/api/c` and the
  admin router at `/api/admin`, and serves `frontend/dist` with an SPA fallback.
  `src/config.ts` (PASSCODE fail-closed posture, PORT), `src/db.ts`
  (`@replit/database` wrapper), `src/auth.ts` (header-based, timing-safe check),
  `src/lib/`, `src/services/` (`cohorts.ts`, `teams.ts`, `prompts.ts`),
  `src/routes/` (`student.ts`, `admin.ts`). See `backend/README.md`.
- `frontend/` — React 18 + TypeScript + Vite SPA. `src/App.tsx` reads
  `?grupo=<id>`, verifies the cohort (`getCohort`), and shows a group-code gate
  if it is missing/archived; `src/views/` holds Day1/Day2/Admin;
  `src/api.ts` is the typed fetch client (centralizes the `X-Passcode` header
  and blob downloads); `src/ui.tsx` holds Header/DayTabs/GroupGate/etc.
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

## Access & security (verified July 2026)

1. **Passcode by header, never query string.** The passcode arrives in the
   `X-Passcode` header (preferred) or `{code}` in a POST body — never in a URL
   (`backend/src/auth.ts`). The front sends it the same way, including for
   downloads, which use fetch + blob so nothing lands in URLs/history
   (`frontend/src/api.ts`).
2. **Fail-closed in production.** If `NODE_ENV=production` or `REPLIT_DEPLOYMENT`
   is set and `PASSCODE` is not configured, admin routes return
   `500 "Server passcode not configured."`. In development the default
   `roster2026` is used with a loud startup warning
   (`backend/src/config.ts: warnPasscodeAtStartup`). Comparison is timing-safe
   SHA-256. There is no session state — every request is checked.
3. **One instructor passcode; student isolation is by cohort link.** No student
   accounts.
4. `.gitignore` ignores `*.csv` so exported rosters (PII) are never committed to
   the public fork.
5. **Audit hardening (CC-011), zero new deps.** User URLs must be `http(s)` —
   the server sanitizes LinkedIn to `""` and 400s a bad `docUrl`
   (`backend/src/lib/validate.ts`), and the front guards every `<a href>`
   (`frontend/src/api.ts` `isHttpUrl`); this covers the one XSS surface JSX
   escaping does NOT (`href`, RNF-012). CSV fields starting with `= + - @` are
   prefixed with `'` against formula injection (`backend/src/lib/csv.ts`).
   Security headers + CSP and a hand-rolled per-IP rate limiter live in
   `backend/src/lib/security.ts` (wired in `index.ts`); the limiter is in-memory
   (same multi-instance caveat as `withIndexLock`) and its public threshold is
   deliberately high because a classroom shares one NAT IP.

## Data safety (no destructive clear-all)

- **Archive** a cohort = soft delete (`archived:true`), data kept.
- **Delete a single submission** by key (verified to belong to the cohort).
- **Backup** everything: `GET /api/admin/backup.json`.
- **Migrate legacy** unprefixed `team:*`/`prompt:*` keys into a cohort:
  `POST /api/admin/migrate-legacy` (adoption without loss).

## Known quirks

1. **Local dev uses a file-backed store, not the Replit KV.** `@replit/database`
   needs `REPLIT_DB_URL` (only set inside a Replit workspace). Outside Replit,
   `backend/src/db.ts` falls back to a file-backed `devStore` (`.dev-kv.json`,
   gitignored), so reads **and writes work offline** — it is NOT the Replit KV,
   so still validate real KV behavior on Replit. Handlers wrap KV calls in
   try/catch and return `500` / empty lists rather than crashing.
2. The SPA's default student view is `day2`; the admin dashboard's default tab
   is `prompts`.
3. **The `cohorts` index is a single KV key, mutated under an in-process lock.**
   No compare-and-set in Replit KV, so `createCohort`/`updateCohort`/
   `archiveCohort` serialize their read-modify-write through `withIndexLock`
   (CC-008) — this stops last-write-wins within the single Replit process.
   Residual: the lock is in-memory, so it would not span multiple instances (not
   used by this single-service deploy). See `docs/requerimientos/no-funcionales.md`
   "Límites conocidos".

## No AI (deliberate)

The team deliberately did **not** integrate any AI feature. Do not add one
speculatively; it would only be revisited for a genuinely creative use.

## Docs & process (docs/, in Spanish)

- **Scope changes go through a change request first**: add a `CC-###` in
  `docs/cambios/` (template + `registro.md` there) before touching code, and
  reference the CC id in commit messages.
- Requirements live in `docs/requerimientos/` (RF/RNF/RES), each item citing
  `file:lines`; keep them in sync with code.
- Durable technical decisions get an ADR in `docs/decisiones/`. Current
  accepted direction is **ADR-0003** (modern TS+Express / React+Vite stack at
  the repo root, Replit KV kept), which supersedes 0002 and 0001.
- Change-control baseline (see `docs/cambios/registro.md` for the authoritative
  list): **CC-001…CC-012** are registered. CC-003…CC-010 formalized the
  cohort-isolation + first security-hardening work (ADR-0004); **CC-011**
  (audit security hardening, refines ADR-0004) and **CC-012** (code hygiene +
  type reconciliation, ADR-0007) are the latest, both implemented. When you
  formalize new work, add the CC/ADR and update `registro.md` and the ADR index
  — do not cite a CC/ADR number that does not yet exist on disk.
- **Types are backend-canonical (ADR-0007).** `backend/src/types.ts` owns the
  data contract; `frontend/src/types.ts` is a hand-kept mirror that may only add
  the client-only fields marked in its header. Keep them in sync.
- Before deploying, run `docs/pruebas/checklist-humo.md` end to end.

## Style

- TypeScript throughout. Backend is CommonJS (compiled by `tsc`); frontend is
  ES modules + React function components bundled by Vite.
- Match the existing terse style. API responses follow the existing shape:
  `{ok: true}` / `{cohort|teams|logs|names|...}` on success, `{error: "..."}` on
  failure (CSV/text routes send plain-text errors).
