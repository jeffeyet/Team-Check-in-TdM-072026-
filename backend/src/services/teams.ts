import * as db from "../db";
import { Team, TeamRecord } from "../types";

export async function loadTeams(): Promise<TeamRecord[]> {
  const keys = await db.list("team:");
  const out: TeamRecord[] = [];
  for (const k of keys) {
    const v = await db.get<Team>(k);
    if (v) out.push({ key: k, ...v });
  }
  out.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return out;
}

export function dedupeTeams(raw: TeamRecord[]): TeamRecord[] {
  const byName: Record<string, TeamRecord> = {};
  for (const r of raw) byName[(r.teamName || "-").trim().toLowerCase()] = r;
  return Object.values(byName).sort((a, b) =>
    (a.teamName || "").localeCompare(b.teamName || "")
  );
}

export async function saveTeam(clean: Team): Promise<void> {
  const key = "team:" + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
  await db.set(key, clean);
}

export async function clearTeams(): Promise<void> {
  const keys = await db.list("team:");
  for (const k of keys) await db.del(k);
}
