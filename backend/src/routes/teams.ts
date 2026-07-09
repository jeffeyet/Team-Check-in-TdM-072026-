import { Router } from "express";
import { checkCode } from "../auth";
import { badPasscode, unauthorizedText } from "../lib/respond";
import { csvLine } from "../lib/csv";
import { Member, Team } from "../types";
import {
  loadTeams,
  dedupeTeams,
  saveTeam,
  clearTeams,
} from "../services/teams";

const router = Router();

// ===================== DAY 1: TEAM CHECK-IN =====================
router.post("/submit", async (req, res) => {
  try {
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
    await saveTeam(clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

router.get("/roster", async (req, res) => {
  if (!checkCode(req)) return badPasscode(res);
  try {
    res.json({ teams: dedupeTeams(await loadTeams()) });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

router.post("/clear", async (req, res) => {
  if (!checkCode(req)) return badPasscode(res);
  try {
    await clearTeams();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Clear failed." });
  }
});

router.get("/export.csv", async (req, res) => {
  if (!checkCode(req)) return unauthorizedText(res);
  const teams = dedupeTeams(await loadTeams());
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
  res.setHeader("Content-Disposition", "attachment; filename=team-checkins.csv");
  res.send(lines.join("\n"));
});

// Public list of team names (no sensitive data) - powers the Day 2 datalist.
router.get("/teamnames", async (req, res) => {
  try {
    const names = [
      ...new Set((await loadTeams()).map((t) => t.teamName).filter(Boolean)),
    ].sort();
    res.json({ names });
  } catch (e) {
    res.json({ names: [] });
  }
});

export default router;
