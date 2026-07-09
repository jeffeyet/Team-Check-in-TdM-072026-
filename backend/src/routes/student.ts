import { Router } from "express";
import { Member, Team, PromptLog } from "../types";
import { getActiveCohort } from "../services/cohorts";
import { loadTeams, saveTeam } from "../services/teams";
import { savePrompt } from "../services/prompts";

// Public, cohort-scoped routes. Mounted at /api/c.
const router = Router({ mergeParams: true });

// GET /api/c/:cohort -> resolve a group by id (404 if missing/archived).
router.get("/:cohort", async (req, res) => {
  try {
    const cohort = await getActiveCohort(req.params.cohort);
    if (!cohort) return res.status(404).json({ error: "Group not found." });
    res.json({ cohort: { id: cohort.id, label: cohort.label } });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

// GET /api/c/:cohort/teamnames -> unique, sorted names for THIS cohort.
// Never 401; returns {names:[]} on any error. Gated on getActiveCohort so an
// archived/missing cohort yields [] instead of leaking its team names (CC-007).
router.get("/:cohort/teamnames", async (req, res) => {
  try {
    const cohort = await getActiveCohort(req.params.cohort);
    if (!cohort) return res.json({ names: [] });
    const names = [
      ...new Set(
        (await loadTeams(cohort.id)).map((t) => t.teamName).filter(Boolean)
      ),
    ].sort();
    res.json({ names });
  } catch (e) {
    res.json({ names: [] });
  }
});

// ===================== DAY 1: TEAM CHECK-IN =====================
router.post("/:cohort/submit", async (req, res) => {
  try {
    const cohort = await getActiveCohort(req.params.cohort);
    if (!cohort) return res.status(404).json({ error: "Group not found." });
    const { teamName, members, idea } = req.body || {};
    if (!teamName || !Array.isArray(members) || members.length === 0 || !idea) {
      return res
        .status(400)
        .json({ error: "Missing team name, members, or idea." });
    }
    const clean: Team = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      members: members
        .filter((m: any) => m && m.name)
        .slice(0, 6)
        .map(
          (m: any): Member => ({
            name: String(m.name).slice(0, 120),
            linkedin: String(m.linkedin || "").slice(0, 300),
            isPM: !!m.isPM,
          })
        ),
      ts: Date.now(),
    };
    await saveTeam(cohort.id, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

// ===================== DAY 2: PROMPT LOG =====================
router.post("/:cohort/prompt-submit", async (req, res) => {
  try {
    const cohort = await getActiveCohort(req.params.cohort);
    if (!cohort) return res.status(404).json({ error: "Group not found." });
    const { teamName, idea, docUrl } = req.body || {};
    if (!teamName || !idea || !docUrl) {
      return res
        .status(400)
        .json({ error: "Missing team, revised idea, or Google Doc link." });
    }
    const clean: PromptLog = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      docUrl: String(docUrl).slice(0, 500),
      ts: Date.now(),
    };
    await savePrompt(cohort.id, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

export default router;
