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
| Server   | Node.js + Express 4 (`index.js`, no build step) |
| Storage  | Replit key-value database (`@replit/database`) — keys `team:*` and `prompt:*` |
| Frontend | Single static file, `public/index.html` (vanilla JS, inline CSS plus a Google Fonts `<link>`, no framework) |
| Hosting  | Replit Autoscale deployment |

## Repository layout (current)

```
index.js            Express server + all API routes (Day 1, Day 2, admin)
public/index.html   Entire UI: styles, markup, and client JS in one file
package.json        Dependencies and `npm start` script
replit              Replit run/deploy config (NOTE: missing its leading dot — inactive as-is)
gitignore           Ignore rules (NOTE: missing its leading dot — inactive as-is)
CLAUDE.md           Context file for Claude Code sessions
```

## Run locally

```bash
npm install
npm start           # → http://localhost:3000
```

**Heads-up (verified):** outside Replit the server starts and serves the UI,
but every database operation fails (submissions return `Save failed.`),
because `@replit/database` needs the `REPLIT_DB_URL` that only exists inside a
Replit workspace. Local runs are fine for UI and route work; to exercise real
reads/writes, run the repl on Replit (or copy a `REPLIT_DB_URL` secret from
one into your local env).

## Deploy on Replit

1. Import the repo: **Create App → Import from GitHub**.
2. Press **Run** to test, then **Deploy → Autoscale** for a public URL.

## Configuration

| Variable   | Default      | Purpose |
|------------|--------------|---------|
| `PASSCODE` | `roster2026` | Instructor passcode (set as a Secret in Replit: Tools → Secrets) |
| `PORT`     | `3000`       | HTTP port |

## API reference

Request bodies are JSON. Responses are JSON too, except the two `*.csv` export
routes, which return `text/csv` (and a plain-text `Unauthorized` on a bad
passcode). `code` is the instructor passcode, accepted as a query param or in
the JSON body.

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

## Team workflow

- All team work happens on **`Solanum_Branch`** — never commit directly to `main`.
- Read [`CLAUDE.md`](CLAUDE.md) (Claude Code loads it automatically) before
  making changes with an AI pair.
