// AI Leadership Intensive - team portal
// Day 1: team check-in.  Day 2: prompt log (Google Doc link + revised idea).
const express = require("express");
const Database = require("@replit/database");

const db = new Database();
const app = express();
app.use(express.json());
app.use(express.static("public"));

// Change the passcode by adding a Secret named PASSCODE in Replit (Tools > Secrets).
const PASSCODE = process.env.PASSCODE || "roster2026";

function checkCode(req) {
  const code = (req.query.code || (req.body && req.body.code) || "").toString();
  return code === PASSCODE;
}

// ===================== DAY 1: TEAM CHECK-IN =====================
app.post("/api/submit", async (req, res) => {
  try {
    const { teamName, members, idea } = req.body || {};
    if (!teamName || !Array.isArray(members) || members.length === 0 || !idea) {
      return res.status(400).json({ error: "Missing team name, members, or idea." });
    }
    const clean = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      members: members.filter(m => m && m.name).slice(0, 6).map(m => ({
        name: String(m.name).slice(0, 120),
        linkedin: String(m.linkedin || "").slice(0, 300),
        isPM: !!m.isPM
      })),
      ts: Date.now()
    };
    const key = "team:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
    await db.set(key, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

async function loadTeams() {
  const keys = await db.list("team:");
  const out = [];
  for (const k of keys) { const v = await db.get(k); if (v) out.push({ key: k, ...v }); }
  out.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return out;
}
function dedupeTeams(raw) {
  const byName = {};
  for (const r of raw) byName[(r.teamName || "-").trim().toLowerCase()] = r;
  return Object.values(byName).sort((a, b) => (a.teamName || "").localeCompare(b.teamName || ""));
}

app.get("/api/roster", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { res.json({ teams: dedupeTeams(await loadTeams()) }); }
  catch (e) { res.status(500).json({ error: "Load failed." }); }
});

app.post("/api/clear", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { const keys = await db.list("team:"); for (const k of keys) await db.delete(k); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: "Clear failed." }); }
});

app.get("/api/export.csv", async (req, res) => {
  if (!checkCode(req)) return res.status(401).send("Unauthorized");
  const teams = dedupeTeams(await loadTeams());
  const lines = [["team", "member", "linkedin", "isPM", "idea", "submittedAt"].join(",")];
  for (const t of teams) {
    const when = new Date(t.ts).toISOString();
    (t.members || []).forEach(m => {
      lines.push([t.teamName, m.name, m.linkedin || "", m.isPM ? "yes" : "", t.idea || "", when]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=team-checkins.csv");
  res.send(lines.join("\n"));
});

// Public list of team names (no sensitive data) - powers the Day 2 datalist.
app.get("/api/teamnames", async (req, res) => {
  try {
    const names = [...new Set((await loadTeams()).map(t => t.teamName).filter(Boolean))].sort();
    res.json({ names });
  } catch (e) { res.json({ names: [] }); }
});

// ===================== DAY 2: PROMPT LOG =====================
app.post("/api/prompt-submit", async (req, res) => {
  try {
    const { teamName, idea, docUrl } = req.body || {};
    if (!teamName || !idea || !docUrl) {
      return res.status(400).json({ error: "Missing team, revised idea, or Google Doc link." });
    }
    const clean = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      docUrl: String(docUrl).slice(0, 500),
      ts: Date.now()
    };
    const key = "prompt:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
    await db.set(key, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

async function loadPrompts() {
  const keys = await db.list("prompt:");
  const out = [];
  for (const k of keys) { const v = await db.get(k); if (v) out.push({ key: k, ...v }); }
  out.sort((a, b) => ((a.teamName || "").localeCompare(b.teamName || "")) || (a.ts || 0) - (b.ts || 0));
  return out;
}

app.get("/api/prompt-roster", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { res.json({ logs: await loadPrompts() }); }
  catch (e) { res.status(500).json({ error: "Load failed." }); }
});

app.post("/api/prompt-clear", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { const keys = await db.list("prompt:"); for (const k of keys) await db.delete(k); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: "Clear failed." }); }
});

app.get("/api/prompt-export.csv", async (req, res) => {
  if (!checkCode(req)) return res.status(401).send("Unauthorized");
  const logs = await loadPrompts();
  const lines = [["team", "revisedIdea", "docUrl", "submittedAt"].join(",")];
  for (const l of logs) {
    lines.push([l.teamName, l.idea || "", l.docUrl || "", new Date(l.ts).toISOString()]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=prompt-logs.csv");
  res.send(lines.join("\n"));
});

// ===================== DAY 3: PROJECT DIAGRAM =====================
const MAX_DIAGRAM_BOXES = 12;
const MAX_DIAGRAM_ARROWS = 30;

function cleanDiagramBoxes(boxes) {
  if (!Array.isArray(boxes)) return [];
  return boxes.slice(0, MAX_DIAGRAM_BOXES)
    .filter(b => b && b.id && b.label)
    .map(b => ({
      id: String(b.id).slice(0, 40),
      label: String(b.label).slice(0, 60),
      x: Number.isFinite(b.x) ? Math.max(0, Math.min(4000, b.x)) : 0,
      y: Number.isFinite(b.y) ? Math.max(0, Math.min(4000, b.y)) : 0
    }));
}
function cleanDiagramArrows(arrows, boxIds) {
  if (!Array.isArray(arrows)) return [];
  const ids = new Set(boxIds);
  return arrows.slice(0, MAX_DIAGRAM_ARROWS)
    .filter(a => a && ids.has(a.from) && ids.has(a.to) && a.from !== a.to)
    .map(a => ({ from: String(a.from).slice(0, 40), to: String(a.to).slice(0, 40) }));
}

app.post("/api/diagram-submit", async (req, res) => {
  try {
    const { teamName, boxes, arrows } = req.body || {};
    const cleanBoxes = cleanDiagramBoxes(boxes);
    if (!teamName || cleanBoxes.length === 0) {
      return res.status(400).json({ error: "Missing team name or diagram boxes." });
    }
    const clean = {
      teamName: String(teamName).slice(0, 120),
      boxes: cleanBoxes,
      arrows: cleanDiagramArrows(arrows, cleanBoxes.map(b => b.id)),
      ts: Date.now()
    };
    const key = "diagram:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
    await db.set(key, clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

async function loadDiagrams() {
  const keys = await db.list("diagram:");
  const out = [];
  for (const k of keys) { const v = await db.get(k); if (v) out.push({ key: k, ...v }); }
  out.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return out;
}

app.get("/api/diagram-roster", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { res.json({ diagrams: dedupeTeams(await loadDiagrams()) }); }
  catch (e) { res.status(500).json({ error: "Load failed." }); }
});

app.post("/api/diagram-clear", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try { const keys = await db.list("diagram:"); for (const k of keys) await db.delete(k); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: "Clear failed." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Portal running on port " + PORT));
