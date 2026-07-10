# Team Check-In - AI Leadership Intensive

A small web portal where each team logs its name, members (with LinkedIn),
first PM, and a one-sentence idea. Built for the Berkeley Innovation Group
AI Leadership Intensive as a live vibe-coding demo.

## What it does
- Students register a team, members, first PM, and initial one-sentence idea.
- Teams submit updated ideas with Google Docs links as the course progresses.
- Instructors open a passcode-gated roster with per-team cards and CSV export.
- New assignment submissions can use the generic `submission:*` data model.

## Project structure
```
index.js            Express server + API
package.json        Dependencies and start script
public/index.html   The portal UI (form + roster)
```

## Run locally
```
npm install
set DATABASE_URL=postgresql://...
set PASSCODE=choose-a-long-unique-passcode
npm start
```
Then open http://localhost:3000

## Deploy on Replit
Import this repo from GitHub, add a `PASSCODE` Secret, confirm the Replit
Database tool has provided `DATABASE_URL`, and press Run. Check `/api/health`,
then use Publishing -> Autoscale for a public URL with a production database.

## Instructor passcode
Required. Set a strong, unique `PASSCODE` environment variable. In Replit,
add it with Tools -> Secrets. The server refuses to start without it.

## Data
Submissions are stored in Replit's managed PostgreSQL database using
`DATABASE_URL`. The `app_kv` table retains the `team:*`, `prompt:*`, and
`submission:*` key families. New course artifacts should use `submission:*`
unless they need a custom workflow.
