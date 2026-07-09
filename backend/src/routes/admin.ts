import { Router } from "express";
import { requirePasscode, requirePasscodeText } from "../auth";
import { csvLine } from "../lib/csv";
import { loadTeams, dedupeTeams } from "../services/teams";
import { loadPrompts } from "../services/prompts";
import {
  getCohorts,
  getCohort,
  createCohort,
  updateCohort,
  archiveCohort,
  countCohort,
  deleteSubmission,
  migrateLegacy,
  buildBackup,
} from "../services/cohorts";

// Instructor routes. Mounted at /api/admin. Every route is passcode-gated
// (X-Passcode header, or {code} in the JSON body).
const router = Router();

// GET /api/admin/cohorts -> index + per-cohort counts.
router.get("/cohorts", requirePasscode, async (req, res) => {
  try {
    const cohorts = await getCohorts();
    const withCounts = await Promise.all(
      cohorts.map(async (c) => {
        const { teamCount, promptCount } = await countCohort(c.id);
        return { ...c, teamCount, promptCount };
      })
    );
    res.json({ cohorts: withCounts });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

// POST /api/admin/cohorts -> create {label, id?}.
router.post("/cohorts", requirePasscode, async (req, res) => {
  try {
    const { label, id } = req.body || {};
    const result = await createCohort(label, id);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    res.json({ cohort: result.cohort });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

// PATCH /api/admin/cohorts/:id -> update {label?, archived?}.
router.patch("/cohorts/:id", requirePasscode, async (req, res) => {
  try {
    const { label, archived } = req.body || {};
    const cohort = await updateCohort(req.params.id, { label, archived });
    if (!cohort) return res.status(404).json({ error: "Cohort not found." });
    res.json({ cohort });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

// GET /api/admin/cohorts/:id/roster -> deduped teams (alphabetical).
router.get("/cohorts/:id/roster", requirePasscode, async (req, res) => {
  try {
    const cohort = await getCohort(req.params.id);
    if (!cohort) return res.status(404).json({ error: "Cohort not found." });
    res.json({ teams: dedupeTeams(await loadTeams(req.params.id)) });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

// GET /api/admin/cohorts/:id/prompts -> prompt logs (by teamName then ts).
router.get("/cohorts/:id/prompts", requirePasscode, async (req, res) => {
  try {
    const cohort = await getCohort(req.params.id);
    if (!cohort) return res.status(404).json({ error: "Cohort not found." });
    res.json({ logs: await loadPrompts(req.params.id) });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

// GET /api/admin/cohorts/:id/export/teams.csv
router.get(
  "/cohorts/:id/export/teams.csv",
  requirePasscodeText,
  async (req, res) => {
    try {
      const teams = dedupeTeams(await loadTeams(req.params.id));
      const lines = [
        ["team", "member", "linkedin", "isPM", "idea", "submittedAt"].join(","),
      ];
      for (const t of teams) {
        const when = new Date(t.ts).toISOString();
        (t.members || []).forEach((m) => {
          lines.push(
            csvLine([
              t.teamName,
              m.name,
              m.linkedin || "",
              m.isPM ? "yes" : "",
              t.idea || "",
              when,
            ])
          );
        });
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=team-checkins.csv"
      );
      res.send(lines.join("\n"));
    } catch (e) {
      res.status(500).send("Export failed.");
    }
  }
);

// GET /api/admin/cohorts/:id/export/prompts.csv
router.get(
  "/cohorts/:id/export/prompts.csv",
  requirePasscodeText,
  async (req, res) => {
    try {
      const logs = await loadPrompts(req.params.id);
      const lines = [["team", "revisedIdea", "docUrl", "submittedAt"].join(",")];
      for (const l of logs) {
        lines.push(
          csvLine([
            l.teamName,
            l.idea || "",
            l.docUrl || "",
            new Date(l.ts).toISOString(),
          ])
        );
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=prompt-logs.csv");
      res.send(lines.join("\n"));
    } catch (e) {
      res.status(500).send("Export failed.");
    }
  }
);

// DELETE /api/admin/cohorts/:id/submissions/:key -> delete one submission.
router.delete(
  "/cohorts/:id/submissions/:key",
  requirePasscode,
  async (req, res) => {
    try {
      const ok = await deleteSubmission(
        req.params.id,
        decodeURIComponent(req.params.key)
      );
      if (!ok) return res.status(404).json({ error: "Submission not found." });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Delete failed." });
    }
  }
);

// POST /api/admin/cohorts/:id/archive -> soft delete.
router.post("/cohorts/:id/archive", requirePasscode, async (req, res) => {
  try {
    const ok = await archiveCohort(req.params.id);
    if (!ok) return res.status(404).json({ error: "Cohort not found." });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Archive failed." });
  }
});

// POST /api/admin/migrate-legacy -> move unprefixed keys into a cohort.
router.post("/migrate-legacy", requirePasscode, async (req, res) => {
  try {
    const { cohortId } = req.body || {};
    if (!cohortId) return res.status(400).json({ error: "Missing cohortId." });
    const moved = await migrateLegacy(String(cohortId));
    res.json({ moved });
  } catch (e) {
    res.status(500).json({ error: "Migration failed." });
  }
});

// GET /api/admin/backup.json -> portable full backup.
router.get("/backup.json", requirePasscode, async (req, res) => {
  try {
    const backup = await buildBackup();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=backup.json");
    res.send(JSON.stringify(backup, null, 2));
  } catch (e) {
    res.status(500).json({ error: "Backup failed." });
  }
});

export default router;
