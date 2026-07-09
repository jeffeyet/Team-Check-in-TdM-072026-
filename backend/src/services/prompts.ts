import * as db from "../db";
import { PromptLog, PromptLogRecord } from "../types";

export async function loadPrompts(): Promise<PromptLogRecord[]> {
  const keys = await db.list("prompt:");
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

export async function savePrompt(clean: PromptLog): Promise<void> {
  const key =
    "prompt:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
  await db.set(key, clean);
}

export async function clearPrompts(): Promise<void> {
  const keys = await db.list("prompt:");
  for (const k of keys) await db.del(k);
}
