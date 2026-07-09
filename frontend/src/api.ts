import type { Member, Team, PromptLog, Cohort } from "./types";

// Centralized, typed fetch client for the cohort-scoped API.
//
// The instructor passcode is ALWAYS sent in the "X-Passcode" header (never in a
// query string). Downloads (CSV, backup) go through fetch + blob so the passcode
// stays out of the URL/browser history.

const PASSCODE_HEADER = "X-Passcode";

function authHeaders(
  code: string,
  extra?: Record<string, string>
): Record<string, string> {
  return { [PASSCODE_HEADER]: code, ...(extra || {}) };
}

function c(cohort: string): string {
  return "/api/c/" + encodeURIComponent(cohort);
}

// ============================ STUDENT (public) ============================

// Returns the cohort if it exists and is not archived, otherwise null.
export async function getCohort(id: string): Promise<Cohort | null> {
  try {
    const r = await fetch(c(id));
    if (!r.ok) return null;
    const d = await r.json();
    return d.cohort || null;
  } catch {
    return null;
  }
}

export async function getTeamNames(cohort: string): Promise<string[]> {
  try {
    const r = await fetch(c(cohort) + "/teamnames");
    const d = await r.json();
    return d.names || [];
  } catch {
    return [];
  }
}

export async function submitTeam(
  cohort: string,
  payload: { teamName: string; members: Member[]; idea: string }
): Promise<void> {
  const r = await fetch(c(cohort) + "/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("submit failed");
}

export async function submitPrompt(
  cohort: string,
  payload: { teamName: string; idea: string; docUrl: string }
): Promise<void> {
  const r = await fetch(c(cohort) + "/prompt-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("submit failed");
}

// ============================ INSTRUCTOR (admin) ============================

// 401 -> null so the caller can tell a bad passcode apart from a real list.
// Other non-2xx responses throw with the server's error text (e.g. the
// "Server passcode not configured." 500 in production).
export async function listCohorts(code: string): Promise<Cohort[] | null> {
  const r = await fetch("/api/admin/cohorts", { headers: authHeaders(code) });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(await errText(r));
  const d = await r.json();
  return d.cohorts || [];
}

export async function createCohort(
  code: string,
  label: string,
  id?: string
): Promise<Cohort> {
  const r = await fetch("/api/admin/cohorts", {
    method: "POST",
    headers: authHeaders(code, { "Content-Type": "application/json" }),
    body: JSON.stringify(id ? { label, id } : { label }),
  });
  if (r.status === 409) throw new Error("Cohort already exists.");
  if (!r.ok) throw new Error(await errText(r));
  const d = await r.json();
  return d.cohort;
}

export async function patchCohort(
  code: string,
  id: string,
  patch: { label?: string; archived?: boolean }
): Promise<Cohort> {
  const r = await fetch("/api/admin/cohorts/" + encodeURIComponent(id), {
    method: "PATCH",
    headers: authHeaders(code, { "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await errText(r));
  const d = await r.json();
  return d.cohort;
}

export async function archiveCohort(code: string, id: string): Promise<void> {
  const r = await fetch(
    "/api/admin/cohorts/" + encodeURIComponent(id) + "/archive",
    {
      method: "POST",
      headers: authHeaders(code, { "Content-Type": "application/json" }),
      body: "{}",
    }
  );
  if (!r.ok) throw new Error(await errText(r));
}

export async function getCohortRoster(
  code: string,
  id: string
): Promise<Team[]> {
  try {
    const r = await fetch(
      "/api/admin/cohorts/" + encodeURIComponent(id) + "/roster",
      { headers: authHeaders(code) }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.teams || [];
  } catch {
    return [];
  }
}

export async function getCohortPrompts(
  code: string,
  id: string
): Promise<PromptLog[]> {
  try {
    const r = await fetch(
      "/api/admin/cohorts/" + encodeURIComponent(id) + "/prompts",
      { headers: authHeaders(code) }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.logs || [];
  } catch {
    return [];
  }
}

// Deletes a single submission by its storage key (full key or suffix).
export async function deleteSubmission(
  code: string,
  id: string,
  key: string
): Promise<void> {
  const r = await fetch(
    "/api/admin/cohorts/" +
      encodeURIComponent(id) +
      "/submissions/" +
      encodeURIComponent(key),
    { method: "DELETE", headers: authHeaders(code) }
  );
  if (!r.ok) throw new Error(await errText(r));
}

// Moves legacy (unprefixed) team:*/prompt:* keys into a cohort. Returns count.
export async function migrateLegacy(
  code: string,
  cohortId: string
): Promise<number> {
  const r = await fetch("/api/admin/migrate-legacy", {
    method: "POST",
    headers: authHeaders(code, { "Content-Type": "application/json" }),
    body: JSON.stringify({ cohortId }),
  });
  if (!r.ok) throw new Error(await errText(r));
  const d = await r.json();
  return d.moved || 0;
}

// ============================ DOWNLOADS (blob) ============================

async function downloadBlob(
  url: string,
  code: string,
  filename: string
): Promise<void> {
  const r = await fetch(url, { headers: authHeaders(code) });
  if (!r.ok) throw new Error(await errText(r));
  const blob = await r.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export async function exportTeamsCsv(code: string, id: string): Promise<void> {
  await downloadBlob(
    "/api/admin/cohorts/" + encodeURIComponent(id) + "/export/teams.csv",
    code,
    id + "-team-checkins.csv"
  );
}

export async function exportPromptsCsv(code: string, id: string): Promise<void> {
  await downloadBlob(
    "/api/admin/cohorts/" + encodeURIComponent(id) + "/export/prompts.csv",
    code,
    id + "-prompt-logs.csv"
  );
}

export async function downloadBackup(code: string): Promise<void> {
  await downloadBlob(
    "/api/admin/backup.json",
    code,
    "team-checkin-backup.json"
  );
}

// ============================ helpers ============================

async function errText(r: Response): Promise<string> {
  try {
    const d = await r.json();
    if (d && d.error) return d.error;
  } catch {
    // not JSON
  }
  return "Request failed (" + r.status + ").";
}

// Copies text to the clipboard, with a legacy fallback. Returns success.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function shareLink(id: string): string {
  return window.location.origin + "/?grupo=" + encodeURIComponent(id);
}
