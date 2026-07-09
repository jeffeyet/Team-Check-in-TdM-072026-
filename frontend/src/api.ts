import type { Member, Team, PromptLog } from "./types";

// Centralized, typed fetch helpers. Paths mirror the original SPA exactly.

export async function submitTeam(payload: {
  teamName: string;
  members: Member[];
  idea: string;
}): Promise<void> {
  const r = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("submit failed");
}

export async function submitPrompt(payload: {
  teamName: string;
  idea: string;
  docUrl: string;
}): Promise<void> {
  const r = await fetch("/api/prompt-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("submit failed");
}

export async function getTeamNames(): Promise<string[]> {
  try {
    const r = await fetch("/api/teamnames");
    const d = await r.json();
    return d.names || [];
  } catch {
    return [];
  }
}

// 401 -> null so the caller can distinguish a bad passcode from data.
export async function getPromptRoster(code: string): Promise<PromptLog[] | null> {
  const r = await fetch("/api/prompt-roster?code=" + encodeURIComponent(code));
  if (r.status === 401) return null;
  const d = await r.json();
  return d.logs || [];
}

export async function getRoster(code: string): Promise<Team[]> {
  try {
    const r = await fetch("/api/roster?code=" + encodeURIComponent(code));
    const d = await r.json();
    return d.teams || [];
  } catch {
    return [];
  }
}

export async function clearTeams(code: string): Promise<void> {
  await fetch("/api/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export async function clearPrompts(code: string): Promise<void> {
  await fetch("/api/prompt-clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export function exportTeamsCsv(code: string): void {
  window.location.href = "/api/export.csv?code=" + encodeURIComponent(code);
}

export function exportPromptsCsv(code: string): void {
  window.location.href = "/api/prompt-export.csv?code=" + encodeURIComponent(code);
}
