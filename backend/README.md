# Backend — Check-In Portal API

Express 4 + TypeScript (CommonJS, compiled with `tsc` → `dist/`) API for the
AI Leadership Intensive portal. Data is **isolated per cohort** (one group /
edition per box). It exposes cohort-scoped student routes under `/api/c` and
passcode-gated instructor routes under `/api/admin`, and in production serves
the built frontend from `../frontend/dist` with an SPA fallback.

Root docs and the full API tables are in [`../README.md`](../README.md); the
team's Spanish planning docs are in [`../docs`](../docs/README.md).

## Structure (`src/`)

| Path                    | Purpose |
|-------------------------|---------|
| `index.ts`              | Startup: security headers + JSON body limit, `trust proxy`, mounts `student` at `/api/c` and `admin` at `/api/admin` (rate-limited), serves `frontend/dist`, SPA fallback, final error handler |
| `config.ts`             | `PASSCODE` (fail-closed posture), `PORT`; `warnPasscodeAtStartup` |
| `db.ts`                 | Wrapper around `@replit/database` — `get` / `set` / `list(prefix)` / `del` |
| `auth.ts`               | `requirePasscode` (JSON) / `requirePasscodeText` (CSV/text); `X-Passcode` header or `{code}` body, timing-safe SHA-256 |
| `types.ts`              | Canonical data contract: `Member`, `Team`, `PromptLog`, `Cohort` (mirrored by `frontend/src/types.ts`, ADR-0007) |
| `lib/csv.ts`            | CSV line serialization (quoted fields + formula-injection guard) |
| `lib/validate.ts`       | `isHttpUrl` / `sanitizeHttpUrl` — restrict user URLs to http(s) |
| `lib/security.ts`       | `securityHeaders` (+ CSP) and a per-IP `rateLimit` — dependency-free |
| `services/cohorts.ts`   | Cohort index, key-prefix helpers, slugify, create/update/archive, counts, single-submission delete, legacy migration, backup |
| `services/teams.ts`     | Day 1 storage + per-cohort load and dedupe |
| `services/prompts.ts`   | Day 2 storage + per-cohort load |
| `routes/student.ts`     | Public, cohort-scoped routes (`/api/c`) |
| `routes/admin.ts`       | Passcode-gated instructor routes (`/api/admin`) |

## Route contract

### Student — mounted at `/api/c`

| Method | Route                          | Purpose |
|--------|--------------------------------|---------|
| GET    | `/:cohort`                     | Resolve a group; `404 "Group not found."` if missing/archived, else `{cohort:{id,label}}` |
| GET    | `/:cohort/teamnames`           | Unique sorted team names for this cohort; never 401, `{names:[]}` on error |
| POST   | `/:cohort/submit`              | Day 1 `{teamName, members[], idea}`; `400` on missing fields, `404` if group missing/archived, `500 "Save failed."` on KV error |
| POST   | `/:cohort/prompt-submit`       | Day 2 `{teamName, idea, docUrl}`; same error posture, plus `400` if `docUrl` is not an http(s) URL |

### Instructor — mounted at `/api/admin` (every route passcode-gated)

| Method | Route                                    | Purpose |
|--------|------------------------------------------|---------|
| GET    | `/cohorts`                               | Cohort index + per-cohort team/prompt counts |
| POST   | `/cohorts`                               | Create `{label, id?}`; `409` if id exists |
| PATCH  | `/cohorts/:id`                           | Update `{label?, archived?}` |
| GET    | `/cohorts/:id/roster`                    | Deduped teams (per cohort, alphabetical) |
| GET    | `/cohorts/:id/prompts`                   | Prompt logs (by team name, then time) |
| GET    | `/cohorts/:id/export/teams.csv`          | Day 1 CSV, one row per member |
| GET    | `/cohorts/:id/export/prompts.csv`        | Day 2 CSV |
| DELETE | `/cohorts/:id/submissions/:key`          | Delete one submission by key (verified to belong to the cohort) |
| POST   | `/cohorts/:id/archive`                   | Soft delete (`archived:true`) |
| POST   | `/migrate-legacy`                        | `{cohortId}` → move unprefixed `team:*`/`prompt:*` into a cohort; `{moved}` |
| GET    | `/backup.json`                           | Portable full backup (index + every key/value) |

Auth failures: `401 "Bad passcode."` (JSON) or `Unauthorized` (CSV/text). KV
failures are caught per handler and return `500` (`Load/Save/Export/... failed.`)
rather than crashing the process.

**Security posture (CC-011, no new deps):** every response carries security
headers + a CSP; the JSON body is capped at `100kb`; user URLs are restricted to
http(s) (LinkedIn sanitized to `""`, bad `docUrl` → `400`); CSV fields are guarded
against formula injection. Public POSTs and all of `/api/admin` are rate-limited
per IP (**`429`** with `Retry-After`); the limiter is in-memory (single process).
A final error handler turns malformed/oversized bodies into `400`/`413` and any
other unhandled error into a `500` without leaking a stack trace.

## Commands

Run from this directory (or via the root orchestrator, e.g. `npm run build`):

| Command             | What it does |
|---------------------|--------------|
| `npm run build`     | `tsc` → `dist/` |
| `npm start`         | `node dist/index.js` → http://localhost:3000 |
| `npm run dev`       | `tsx watch src/index.ts` (hot reload) |
| `npm run typecheck` | `tsc --noEmit` |

## Configuration

| Variable            | Default          | Purpose |
|---------------------|------------------|---------|
| `PASSCODE`          | `roster2026` (dev only) | Instructor passcode, sent via `X-Passcode` header or `{code}` body |
| `PORT`              | `3000`           | HTTP port |
| `NODE_ENV`          | —                | `production` triggers the fail-closed posture |
| `REPLIT_DEPLOYMENT` | —                | Set by Replit on a deployment; also triggers fail-closed |
| `REPLIT_DB_URL`     | —                | Key-value DB endpoint; injected automatically by Replit |

**Passcode posture (fail-closed):** if `NODE_ENV=production` or
`REPLIT_DEPLOYMENT` is set and `PASSCODE` is not configured, admin routes return
`500 "Server passcode not configured."`. In development the `roster2026` default
is used with a startup warning. Comparison is timing-safe SHA-256 and the
passcode is never read from the query string.

## Storage note (verified)

Data lives in the Replit KV: the cohort index in the `cohorts` key, and
per-cohort data under the `cohort:<id>:team:*` and `cohort:<id>:prompt:*`
prefixes. Reads are always scoped by prefix (no global sweep). `@replit/database`
needs `REPLIT_DB_URL`, which only exists inside a Replit workspace; outside
Replit the server starts and serves the UI, but every KV operation fails
(`Save failed.` / empty lists). Test real reads/writes on Replit.
