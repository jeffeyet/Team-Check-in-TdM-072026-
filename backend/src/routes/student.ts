import { Router } from "express";
import { Member, Team, PromptLog } from "../types";
import { getActiveCohort } from "../services/cohorts";
import { loadTeams, saveTeam } from "../services/teams";
import { savePrompt } from "../services/prompts";
import { sanitizeHttpUrl, isHttpUrl } from "../lib/validate";
import { rateLimit } from "../lib/security";

// Public, cohort-scoped routes. Mounted at /api/c.
const router = Router({ mergeParams: true });

// Throttle the public write path (RNF-015). Deliberately generous: a whole
// classroom can share one public IP (venue NAT), so this must never lock out a
// room of students submitting normally — only a scripted flood exceeds it. It
// covers the POSTs only; GETs (page loads / autocomplete) are never limited.
const submitLimiter = rateLimit({ windowMs: 60_000, max: 100 });

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
router.post("/:cohort/submit", submitLimiter, async (req, res) => {
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
            // Only keep an http(s) LinkedIn URL; anything else (e.g. a
            // "javascript:" link) is dropped to "" so it never renders as an
            // href on the instructor dashboard (RNF-012).
            linkedin: sanitizeHttpUrl(m.linkedin).slice(0, 300),
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
router.post("/:cohort/prompt-submit", submitLimiter, async (req, res) => {
  try {
    const cohort = await getActiveCohort(req.params.cohort);
    if (!cohort) return res.status(404).json({ error: "Group not found." });
    const { teamName, idea, docUrl } = req.body || {};
    if (!teamName || !idea || !docUrl) {
      return res
        .status(400)
        .json({ error: "Missing team, revised idea, or Google Doc link." });
    }
    // The Doc link is required and instructor-facing, so reject anything that is
    // not an http(s) URL rather than silently dropping it (RNF-012).
    if (!isHttpUrl(docUrl)) {
      return res
        .status(400)
        .json({ error: "Enter a valid http(s) link to your Google Doc." });
    }
    const clean: PromptLog = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      docUrl: String(docUrl).trim().slice(0, 500),
      ts: Date.now(),
    };
    await savePrompt(cohort.id, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

export default router;
