import { Router } from "express";
import { checkCode } from "../auth";
import { badPasscode, unauthorizedText } from "../lib/respond";
import { csvLine } from "../lib/csv";
import { PromptLog } from "../types";
import { loadPrompts, savePrompt, clearPrompts } from "../services/prompts";

const router = Router();

// ===================== DAY 2: PROMPT LOG =====================
router.post("/prompt-submit", async (req, res) => {
  try {
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
    await savePrompt(clean);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Save failed." });
  }
});

router.get("/prompt-roster", async (req, res) => {
  if (!checkCode(req)) return badPasscode(res);
  try {
    res.json({ logs: await loadPrompts() });
  } catch (e) {
    res.status(500).json({ error: "Load failed." });
  }
});

router.post("/prompt-clear", async (req, res) => {
  if (!checkCode(req)) return badPasscode(res);
  try {
    await clearPrompts();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Clear failed." });
  }
});

router.get("/prompt-export.csv", async (req, res) => {
  if (!checkCode(req)) return unauthorizedText(res);
  const logs = await loadPrompts();
  const lines = [["team", "revisedIdea", "docUrl", "submittedAt"].join(",")];
  for (const l of logs) {
    lines.push(
      csvLine([l.teamName, l.idea || "", l.docUrl || "", new Date(l.ts).toISOString()])
    );
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=prompt-logs.csv");
  res.send(lines.join("\n"));
});

export default router;
