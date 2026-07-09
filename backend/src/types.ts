// CANONICAL data contract (ADR-0007). These are the shapes stored in the KV and
// sent over the API. `frontend/src/types.ts` MIRRORS this file: its domain types
// must match field-for-field, and may only ADD fields marked as client-only
// there. Keep the two in sync — nothing automated enforces it.

export interface Member {
  name: string;
  linkedin: string; // always an http(s) URL or "" (sanitized on write, RNF-012)
  isPM: boolean;
}

export interface Team {
  teamName: string;
  idea: string;
  members: Member[];
  ts: number;
}

export interface TeamRecord extends Team {
  key: string;
}

export interface PromptLog {
  teamName: string;
  idea: string;
  docUrl: string;
  ts: number;
}

export interface PromptLogRecord extends PromptLog {
  key: string;
}

// A cohort is one isolated data box (group / edition). Its members' data lives
// under the "cohort:<id>:team:*" and "cohort:<id>:prompt:*" key prefixes.
export interface Cohort {
  id: string;
  label: string;
  createdAt: number;
  archived: boolean;
}
