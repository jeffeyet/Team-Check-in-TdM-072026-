// AI Leadership Intensive - team portal
// Day 1: team check-in. Day 2: updated idea (Google Doc link + revised idea).
const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PASSCODE = String(process.env.PASSCODE || "").trim();
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();

const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
}) : null;

const db = {
  async init() {
    if (!pool) throw new Error("DATABASE_URL is required.");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_kv (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  },
  async set(key, value) {
    await pool.query(
      `INSERT INTO app_kv (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  },
  async get(key) {
    const result = await pool.query("SELECT value FROM app_kv WHERE key = $1", [key]);
    return result.rows[0] ? result.rows[0].value : null;
  },
  async list(prefix = "") {
    const result = await pool.query(
      "SELECT key FROM app_kv WHERE LEFT(key, LENGTH($1)) = $1 ORDER BY key",
      [prefix]
    );
    return result.rows.map(row => row.key);
  },
  async delete(key) {
    await pool.query("DELETE FROM app_kv WHERE key = $1", [key]);
  }
};

function checkCode(req) {
  const code = String(req.get("x-admin-passcode") || "").trim();
  const supplied = Buffer.from(code);
  const expected = Buffer.from(PASSCODE);
  if (!PASSCODE || supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(supplied, expected);
}

const ASSIGNMENTS = {
  "updated-idea": "Updated Idea",
  "prd-draft": "Draft PRD"
};

function csvCell(value) {
  return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
}

function validateGoogleDocUrl(raw) {
  try {
    const url = new URL(String(raw || "").trim());
    const isDoc = url.protocol === "https:" &&
      url.hostname === "docs.google.com" &&
      /^\/document\/d\/[^/]+/.test(url.pathname);
    if (!isDoc) return null;
    return url.toString().slice(0, 500);
  } catch (e) {
    return null;
  }
}

function cleanAssignmentId(raw) {
  const id = String(raw || "").trim().toLowerCase();
  return ASSIGNMENTS[id] ? id : "";
}

function cleanExternalUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(String(raw).trim());
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 300) : "";
  } catch (e) {
    return "";
  }
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false });
  }
});

app.get("/api/auth-check", (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  res.json({ ok: true });
});

async function saveAssignmentSubmission(input) {
  const assignmentId = cleanAssignmentId(input.assignmentId);
  const docUrl = validateGoogleDocUrl(input.docUrl);
  if (!assignmentId) throw new Error("Bad assignment.");
  if (!docUrl) throw new Error("Bad Google Doc link.");

  const clean = {
    assignmentId,
    assignmentLabel: ASSIGNMENTS[assignmentId],
    teamName: String(input.teamName || "").slice(0, 120),
    summary: String(input.summary || "").slice(0, 500),
    docUrl,
    status: "submitted",
    ts: Date.now()
  };
  const key = "submission:" + clean.assignmentId + ":" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
  await db.set(key, clean);
  return { key, ...clean };
}

async function loadSubmissions(assignmentId) {
  const keys = await db.list("submission:");
  const out = [];
  for (const k of keys) {
    const v = await db.get(k);
    if (v && (!assignmentId || v.assignmentId === assignmentId)) out.push({ key: k, ...v });
  }
  out.sort((a, b) => ((a.teamName || "").localeCompare(b.teamName || "")) || (a.ts || 0) - (b.ts || 0));
  return out;
}

// ===================== DAY 1: TEAM CHECK-IN =====================
app.post("/api/submit", async (req, res) => {
  try {
    const { teamName, members, idea } = req.body || {};
    if (!teamName || !Array.isArray(members) || members.length === 0 || !idea) {
      return res.status(400).json({ error: "Missing team name, members, or idea." });
    }
    const cleanMembers = members.filter(m => m && m.name).slice(0, 6).map(m => ({
      name: String(m.name).slice(0, 120),
      linkedin: cleanExternalUrl(m.linkedin),
      isPM: !!m.isPM
    }));
    if (cleanMembers.length === 0) {
      return res.status(400).json({ error: "Add at least one named team member." });
    }
    const clean = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      members: cleanMembers,
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
        .map(csvCell).join(","));
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

// ===================== ASSIGNMENT SUBMISSIONS =====================
app.post("/api/submission-submit", async (req, res) => {
  try {
    const { assignmentId, teamName, summary, docUrl } = req.body || {};
    if (!assignmentId || !teamName || !summary || !docUrl) {
      return res.status(400).json({ error: "Missing assignment, team, summary, or Google Doc link." });
    }
    const saved = await saveAssignmentSubmission({ assignmentId, teamName, summary, docUrl });
    res.json({ ok: true, submission: saved });
  } catch (e) {
    const message = e.message === "Bad Google Doc link."
      ? "Use a Google Docs URL that starts with https://docs.google.com/document/d/."
      : "Save failed.";
    res.status(400).json({ error: message });
  }
});

app.get("/api/submissions", async (req, res) => {
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  try {
    const assignmentId = cleanAssignmentId(req.query.assignmentId || "");
    res.json({ submissions: await loadSubmissions(assignmentId), assignments: ASSIGNMENTS });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

app.get("/api/submissions-export.csv", async (req, res) => {
  if (!checkCode(req)) return res.status(401).send("Unauthorized");
  const assignmentId = cleanAssignmentId(req.query.assignmentId || "");
  const submissions = await loadSubmissions(assignmentId);
  const lines = [["assignment", "team", "summary", "docUrl", "status", "submittedAt"].join(",")];
  for (const s of submissions) {
    lines.push([s.assignmentLabel || s.assignmentId, s.teamName, s.summary || "", s.docUrl || "", s.status || "", new Date(s.ts).toISOString()]
      .map(csvCell).join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=assignment-submissions.csv");
  res.send(lines.join("\n"));
});

// ===================== DAY 2: UPDATED IDEA =====================
app.post("/api/prompt-submit", async (req, res) => {
  try {
    const { teamName, idea, docUrl } = req.body || {};
    if (!teamName || !idea || !docUrl) {
      return res.status(400).json({ error: "Missing team, revised idea, or Google Doc link." });
    }
    const cleanUrl = validateGoogleDocUrl(docUrl);
    if (!cleanUrl) {
      return res.status(400).json({ error: "Use a Google Docs URL that starts with https://docs.google.com/document/d/." });
    }
    const clean = {
      teamName: String(teamName).slice(0, 120),
      idea: String(idea).slice(0, 240),
      docUrl: cleanUrl,
      ts: Date.now()
    };
    const key = "prompt:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
    await db.set(key, clean);
    await saveAssignmentSubmission({
      assignmentId: "updated-idea",
      teamName: clean.teamName,
      summary: clean.idea,
      docUrl: clean.docUrl
    });
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
      .map(csvCell).join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=prompt-logs.csv");
  res.send(lines.join("\n"));
});

const PORT = process.env.PORT || 3000;

async function start() {
  if (!PASSCODE) throw new Error("PASSCODE is required. Add it as a Replit Secret.");
  await db.init();
  app.listen(PORT, "0.0.0.0", () => console.log("Portal running on port " + PORT));
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
