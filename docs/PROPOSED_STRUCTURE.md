# Proposed directory structure

**Status: proposal — not yet applied.** Discuss with the team on
`Solanum_Branch` before executing. Nothing below has been moved yet; the
repo still matches the "current" tree in the README.

## Why restructure

Today the whole backend lives in one 148-line `index.js` (two feature areas +
auth + CSV export interleaved) and the whole frontend in one 385-line
`public/index.html` (CSS + markup + JS inline). That works for a demo, but with
several teammates (and their Claude sessions) editing in parallel, one-file-per-
concern reduces merge conflicts and makes each change reviewable in isolation.

Two files are also broken by name: `gitignore` and `replit` lost their leading
dots (likely during a web upload), so Git ignores nothing and Replit reads no
config from the repo.

## Target tree

```
Team-Check-in-TdM-072026-/
├── README.md
├── CLAUDE.md                  # context for Claude Code sessions
├── package.json               # update "main" → server/index.js
├── .gitignore                 # RENAME from gitignore (currently inert)
├── .replit                    # RENAME from replit; update entrypoint → server/index.js
├── server/
│   ├── index.js               # Express bootstrap: middleware, static, listen
│   ├── db.js                  # Replit DB client + loadTeams/loadPrompts/dedupeTeams
│   ├── auth.js                # checkCode passcode helper (shared by both route files)
│   └── routes/
│       ├── checkin.js         # Day 1: /api/submit, /api/roster, /api/clear,
│       │                      #        /api/export.csv, /api/teamnames
│       └── prompts.js         # Day 2: /api/prompt-submit, /api/prompt-roster,
│                              #        /api/prompt-clear, /api/prompt-export.csv
├── public/
│   ├── index.html             # markup only
│   ├── styles.css             # extracted from the inline <style> block
│   └── app.js                 # extracted from the inline <script> block
└── docs/
    └── PROPOSED_STRUCTURE.md  # this file
```

## Migration checklist (in order)

1. **Rename the dotfiles** — `git mv gitignore .gitignore && git mv replit .replit`.
   Zero code risk; they are inert today.
2. **Split the frontend** — move the `<style>` block to `public/styles.css` and
   the `<script>` block to `public/app.js`; link both from `index.html`. No
   logic changes.
3. **Split the backend** — create `server/` as in the tree above. Use
   `express.static(path.join(__dirname, "..", "public"))` in the new
   `server/index.js`: the current `express.static("public")` resolves against
   the process working directory and would silently serve nothing if the entry
   point moves and the app is launched from another directory.
4. **Update the entry point in BOTH places** — `.replit`
   (`entrypoint = "server/index.js"` and keep `run = "npm start"`) and
   `package.json` (`"main"` and `"scripts.start": "node server/index.js"`).
   Skipping this breaks the Replit deployment.
5. **Verify** — `npm start` locally must serve the UI on :3000; then re-run on
   Replit and make one real Day 1 + Day 2 submission before merging.

## Out of scope (deliberately)

- No framework, bundler, or TypeScript — the course context favors a zero-build
  setup that runs on Replit with `npm start`.
- No database change — Replit KV is what the deployment uses.
