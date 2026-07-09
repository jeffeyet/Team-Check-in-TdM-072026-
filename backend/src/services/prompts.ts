import crypto from "crypto";
import * as db from "../db";
import { PromptLog, PromptLogRecord } from "../types";
import { promptPrefix } from "./cohorts";

// Reads are scoped to a single cohort's prefix (never a global list()).
export async function loadPrompts(cohortId: string): Promise<PromptLogRecord[]> {
  const keys = await db.list(promptPrefix(cohortId));
  const out: PromptLogRecord[] = [];
  for (const k of keys) {
    const v = await db.get<PromptLog>(k);
    if (v) out.push({ key: k, ...v });
  }
  out.sort(
    (a, b) =>
      (a.teamName || "").localeCompare(b.teamName || "") ||
      (a.ts || 0) - (b.ts || 0)
  );
  return out;
}

export async function savePrompt(cohortId: string, clean: PromptLog): Promise<void> {
  // <ts>_<uuid>: sortable ts prefix + collision-free UUID suffix (see saveTeam).
  const key = promptPrefix(cohortId) + clean.ts + "_" + crypto.randomUUID();
  await db.set(key, clean);
}
