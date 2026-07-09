export type View = "day1" | "day2" | "admin";
export type AdminTab = "teams" | "prompts";

export interface Member {
  name: string;
  linkedin?: string;
  isPM: boolean;
}

export interface Team {
  teamName: string;
  idea: string;
  members: Member[];
  ts?: number;
  // Storage key ("cohort:<id>:team:<ts>_<rand>"), present on admin roster
  // responses so a single submission can be deleted individually.
  key?: string;
}

export interface PromptLog {
  teamName: string;
  idea: string;
  docUrl: string;
  ts?: number;
  // Storage key ("cohort:<id>:prompt:<ts>_<rand>"), present on admin
  // prompt responses so a single submission can be deleted individually.
  key?: string;
}

// A cohort is one isolated data box (group / edition). Student links carry its
// id as "?grupo=<id>".
export interface Cohort {
  id: string;
  label: string;
  createdAt?: number;
  archived?: boolean;
  // Present on the admin cohort index (GET /api/admin/cohorts).
  teamCount?: number;
  promptCount?: number;
}
