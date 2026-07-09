import * as db from "../db";
import { Team, TeamRecord } from "../types";
import { teamPrefix } from "./cohorts";

// Reads are scoped to a single cohort's prefix (never a global list()).
export async function loadTeams(cohortId: string): Promise<TeamRecord[]> {
  const keys = await db.list(teamPrefix(cohortId));
  const out: TeamRecord[] = [];
  for (const k of keys) {
    const v = await db.get<Team>(k);
    if (v) out.push({ key: k, ...v });
  }
  out.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return out;
}

// Dedupe by teamName (trim/lowercase) within the provided list. Because
// loadTeams already scopes to one cohort, this dedupe is per-cohort.
export function dedupeTeams(raw: TeamRecord[]): TeamRecord[] {
  const byName: Record<string, TeamRecord> = {};
  for (const r of raw) byName[(r.teamName || "-").trim().toLowerCase()] = r;
  return Object.values(byName).sort((a, b) =>
    (a.teamName || "").localeCompare(b.teamName || "")
  );
}

export async function saveTeam(cohortId: string, clean: Team): Promise<void> {
  const key =
    teamPrefix(cohortId) + clean.ts + "_" + Math.random().toString(36).slice(2, 7);
  await db.set(key, clean);
}
