import * as db from "../db";
import { Cohort } from "../types";
// Call-time import for the deduped team count (CC-010). teams.ts imports the
// prefix helpers from here; the cycle is call-time only (no top-level use on
// either side), so it resolves safely.
import { loadTeams, dedupeTeams } from "./teams";

// The cohort index lives under a single key holding a JSON array.
const INDEX_KEY = "cohorts";

// ---- key-prefix helpers (reads are ALWAYS scoped by prefix) ----
// The id is normalized with slugify so every prefix-based read/delete accepts a
// non-canonical id (e.g. "Julio 2026") the same way getCohort does. Idempotent
// for canonical slugs, so callers that already pass cohort.id are unaffected
// (CC-007). slugify is a hoisted function declaration, safe to call here.
export function cohortPrefix(id: string): string {
  return "cohort:" + slugify(id) + ":";
}
export function teamPrefix(id: string): string {
  return "cohort:" + slugify(id) + ":team:";
}
export function promptPrefix(id: string): string {
  return "cohort:" + slugify(id) + ":prompt:";
}

// slug: lowercase, strip accents, spaces/punct -> single hyphens, trimmed.
export function slugify(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCohorts(): Promise<Cohort[]> {
  const raw = await db.get<Cohort[]>(INDEX_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function saveCohorts(list: Cohort[]): Promise<void> {
  await db.set(INDEX_KEY, list);
}

// Serialize read-modify-write on the single `cohorts` index key. Replit KV has
// no compare-and-set, but the app runs as ONE process, so an in-process queue
// stops concurrent mutations from clobbering each other, last-write-wins
// (CC-008). In-memory only: it does not span multiple instances (not used by
// this single-service deployment).
let indexLock: Promise<unknown> = Promise.resolve();
function withIndexLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = indexLock.then(fn, fn);
  // Keep the chain going whether fn resolves or rejects, without leaking.
  indexLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function getCohort(id: string): Promise<Cohort | null> {
  // Match case-insensitively: stored ids are slugs, so normalize the lookup —
  // a student typing "Julio 2026" or "JULIO-2026" still finds "julio-2026".
  const norm = slugify(id);
  const list = await getCohorts();
  return list.find((c) => c.id === norm) || null;
}

// Returns the cohort only if it exists and is NOT archived (student access).
export async function getActiveCohort(id: string): Promise<Cohort | null> {
  const c = await getCohort(id);
  return c && !c.archived ? c : null;
}

export type CreateResult =
  | { ok: true; cohort: Cohort }
  | { ok: false; status: number; error: string };

export async function createCohort(label: string, id?: string): Promise<CreateResult> {
  const cleanLabel = String(label || "").trim().slice(0, 120);
  if (!cleanLabel) return { ok: false, status: 400, error: "Missing label." };
  const finalId = id ? slugify(id) : slugify(cleanLabel);
  if (!finalId) return { ok: false, status: 400, error: "Invalid cohort id." };
  // Serialized so a concurrent create can't pass the uniqueness check and then
  // clobber the index (CC-008).
  return withIndexLock(async () => {
    const list = await getCohorts();
    if (list.some((c) => c.id === finalId)) {
      return { ok: false, status: 409, error: "Cohort already exists." };
    }
    const cohort: Cohort = {
      id: finalId,
      label: cleanLabel,
      createdAt: Date.now(),
      archived: false,
    };
    list.push(cohort);
    await saveCohorts(list);
    return { ok: true, cohort };
  });
}

export async function updateCohort(
  id: string,
  patch: { label?: unknown; archived?: unknown }
): Promise<Cohort | null> {
  const norm = slugify(id);
  // Serialized read-modify-write so it doesn't race other index mutations
  // (CC-008).
  return withIndexLock(async () => {
    const list = await getCohorts();
    const idx = list.findIndex((c) => c.id === norm);
    if (idx === -1) return null;
    if (typeof patch.label === "string") {
      const cleanLabel = patch.label.trim().slice(0, 120);
      if (cleanLabel) list[idx].label = cleanLabel;
    }
    if (typeof patch.archived === "boolean") list[idx].archived = patch.archived;
    await saveCohorts(list);
    return list[idx];
  });
}

// Soft delete: mark archived, never destroy data.
export async function archiveCohort(id: string): Promise<boolean> {
  const updated = await updateCohort(id, { archived: true });
  return !!updated;
}

export async function countCohort(
  id: string
): Promise<{ teamCount: number; promptCount: number }> {
  const [teams, promptKeys] = await Promise.all([
    loadTeams(id),
    db.list(promptPrefix(id)),
  ]);
  // teamCount matches the deduped roster (RF-004) so the number equals the rows
  // the instructor sees; promptCount is raw because all prompt logs are shown
  // (RF-005). (CC-010)
  return { teamCount: dedupeTeams(teams).length, promptCount: promptKeys.length };
}

// Delete a single submission. Accepts either the full key
// ("cohort:<id>:team:...") or a suffix ("team:..." / "prompt:..."), and always
// verifies the resolved key belongs to THIS cohort before deleting.
export async function deleteSubmission(
  cohortId: string,
  keyParam: string
): Promise<boolean> {
  const prefix = cohortPrefix(cohortId);
  let key = String(keyParam || "");
  if (!key.startsWith(prefix)) key = prefix + key;
  if (!key.startsWith(prefix)) return false;
  const existing = await db.get(key);
  if (existing === null || existing === undefined) return false;
  await db.del(key);
  return true;
}

// Move legacy unprefixed keys (team:* / prompt:*) into a cohort box.
// Keys already under "cohort:" are left untouched. Returns how many moved.
export async function migrateLegacy(cohortId: string): Promise<number> {
  let cohort = await getCohort(cohortId);
  if (!cohort) {
    const created = await createCohort(cohortId, cohortId);
    if (!created.ok) return 0;
    cohort = created.cohort;
  }
  const prefix = cohortPrefix(cohort.id);
  const [teamKeys, promptKeys] = await Promise.all([
    db.list("team:"),
    db.list("prompt:"),
  ]);
  let moved = 0;
  for (const k of [...teamKeys, ...promptKeys]) {
    if (k.startsWith("cohort:")) continue; // safety net
    const destKey = prefix + k;
    // Idempotent: if a previous run wrote the destination but failed before the
    // del, just drop the leftover source instead of duplicating/recounting
    // (CC-009). Move is still set-then-del (Replit KV has no transaction).
    const existingDest = await db.get(destKey);
    if (existingDest !== null && existingDest !== undefined) {
      await db.del(k);
      continue;
    }
    const v = await db.get(k);
    if (v === null || v === undefined) continue;
    await db.set(destKey, v);
    await db.del(k);
    moved++;
  }
  return moved;
}

// Portable backup of EVERYTHING: the cohort index plus every key/value.
export async function buildBackup(): Promise<{
  cohorts: Cohort[];
  data: Record<string, unknown>;
}> {
  const cohorts = await getCohorts();
  const keys = await db.list("");
  const data: Record<string, unknown> = {};
  for (const k of keys) data[k] = await db.get(k);
  return { cohorts, data };
}
