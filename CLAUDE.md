# CLAUDE.md — Team Solanum working notes

Context for Claude Code sessions working in this repo. Human teammates: read
`README.md` first.

## What this is

Express + vanilla-JS portal for the Berkeley Innovation Group AI Leadership
Intensive: Day 1 team check-in, Day 2 prompt-log submission, passcode-gated
instructor dashboard. Storage is the Replit key-value DB (`team:*` and
`prompt:*` keys). Full description and API table: `README.md`.

## Branch policy (important)

- **Work on `Solanum_Branch` only.** Never commit or push to `main` — `main`
  belongs to the instructor's upstream repo (`jeffeyet/Team-Check-in-TdM-072026-`).
- Before starting: `git checkout Solanum_Branch && git pull`.
- Commit messages: short imperative subject, e.g. `Split Day 2 routes into prompts.js`.

## Layout & commands

- `index.js` — the entire server: all routes for Day 1, Day 2, and admin.
- `public/index.html` — the entire frontend: inline CSS + JS, no build step.
- `npm install && npm start` → http://localhost:3000.

## Known quirks (verified July 2026)

1. **DB writes fail outside Replit.** `@replit/database` needs `REPLIT_DB_URL`,
   which only exists in a Replit workspace. Locally the UI loads and
   `/api/teamnames` returns `{"names":[]}`, but `/api/submit` returns
   `{"error":"Save failed."}`. Do not chase this as a bug; test real
   reads/writes on Replit.
2. **`gitignore` and `replit` are missing their leading dots** and therefore do
   nothing. `node_modules/` is NOT ignored — do not `git add -A` after
   `npm install`; stage files explicitly.
3. Instructor passcode is `process.env.PASSCODE || "roster2026"`, checked per
   request via query param or JSON body (`code`). There is no session state.
4. The UI is a tiny hand-rolled SPA in one `<script>`: `view` switches between
   `day1`/`day2`/`admin` and `render()` re-draws. It defaults to `day2`.

## Scaling plan

`checkin-platform/` holds the plan (Spanish docs + empty dev skeleton) to grow
this into a multi-class platform with separate frontend and backend. Planning
phase (F0): stack choices there are proposals until the team confirms them in
an ADR. The app at the repo root stays untouched and keeps serving the July
2026 edition.

## Style

- Plain CommonJS (`require`), no TypeScript, no bundler, no new frameworks.
- Match the existing terse style; keep user-facing strings in the same voice.
- New API responses follow the existing shape: `{ok: true}` or `{error: "..."}`.
