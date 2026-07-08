# Instructor guide — Student onboarding kit

This folder is for the instructor. Everything student-facing (the kit README
and all scripts) is in **Spanish**, written for people who have never opened a
terminal. The scripts set up: an SSH key, the key registered on the student's
GitHub account, Git installed, and Git identity (name + email) configured —
with verification and retry loops at every step.

## How to distribute the kit

1. Keep the `kit-inicio/` folder at the **root of this repository**, on the
   default branch (`main`), so GitHub renders `kit-inicio/README.md` nicely.
2. **Fill in the coordinator line** in `kit-inicio/README.md` (Paso 3): who
   students send their username to, and through which channel.
3. Tell students to open the repo page and use **`<> Code` → Download ZIP**.
   That is the whole distribution story — no git knowledge required on their
   side. The kit README walks them through everything else.
4. Ask each student for their **GitHub username** (a Google Form with name,
   email, and username works well).

## Adding students as collaborators (bulk)

Because this is a personal repository, students can only push after you invite
them as collaborators. With the [GitHub CLI](https://cli.github.com) logged in
as the repo owner (`gh auth login`):

```bash
bash kit-inicio/instructor/add-collaborators.sh   # edit the USERNAMES list first
```
(Run it from the repository root; adjust the path if you are elsewhere.)

The script invites every username in its list and reports each result. Notes:

- The API only accepts **usernames, not emails**. Email→username lookup is
  unreliable (only works when a student's email is public on their profile).
- Students must **accept** the invitation (email or github.com/notifications).
  Unaccepted invitations expire after 7 days — tell them to accept the same
  day.
- Collaborators on a personal repo get write access (push, branches, PRs) but
  cannot delete the repo, change settings, or invite others.
- Optional hardening: protect `main` (Settings → Branches → Add rule) so
  student work stays on team branches.

## Optional: one-line install (no ZIP)

Once this kit is merged to `main`, students can skip the ZIP entirely and
paste one line. **Mac** (in Terminal):

```bash
curl -fsSL https://raw.githubusercontent.com/jeffeyet/Team-Check-in-TdM-072026-/main/kit-inicio/mac/configurar-github-ssh.sh -o /tmp/kit-github.sh && bash /tmp/kit-github.sh
```

**Windows** (in PowerShell — Start menu → type "PowerShell"):

```powershell
iwr -UseBasicParsing https://raw.githubusercontent.com/jeffeyet/Team-Check-in-TdM-072026-/main/kit-inicio/windows/lib/configurar-github-ssh.ps1 -OutFile "$env:TEMP\kit-github.ps1"; powershell -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\kit-github.ps1"
```

(`-UseBasicParsing` avoids an interactive security prompt added to patched
Windows PowerShell 5.1 in December 2025.)

Both download the script to a file first and then run it. Do **not** shorten
them to `curl ... | bash` — piping breaks the scripts' interactive questions.

## Folder contents

| File | Purpose |
|---|---|
| `add-collaborators.sh` | Bulk-invite collaborators by GitHub username |
| `INSTRUCTOR.md` | This guide |
