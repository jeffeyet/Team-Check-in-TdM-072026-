export type View = "day1" | "day2" | "day3" | "admin";
// The three student days. A day is either a form (writes cohort data) or a
// read-only guide (rendered from data; see content/days.ts and ADR-0005).
export type DayId = "day1" | "day2" | "day3";
export type AdminTab = "teams" | "prompts";

// --- Guide content model (read-only days, e.g. Day 3 GitHub onboarding) ---
// A one-line concept definition shown as an emoji card.
export interface ConceptCard {
  emoji: string;
  term: string;
  desc: string;
}

// One row of the "what you do vs what the AI does" table.
export interface HumanVsAiRow {
  human: string;
  ai: string;
}

// Named inline SVG diagrams that Guide.tsx knows how to draw (no dependency).
export type DiagramId = "git-cycle";

// The full content of one guide day. Prose is pre-written here (no runtime AI).
export interface GuideContent {
  sub: string; // header subtitle
  intro: string[]; // plain-language paragraphs
  concepts: ConceptCard[];
  diagram?: DiagramId;
  kit: {
    steps: string[]; // the student's steps for the external kit
    copyMessage: string; // the exact one-line message to paste to the AI
    url: string; // link to the AI_GITHUB_Connection kit repo
  };
  humanVsAi: HumanVsAiRow[];
  checklist: string[]; // "you are ready when ..."
  troubleshooting: string;
}

// A day in the catalog: a form (Day 1 / Day 2) or a guide (Day 3).
export interface DayDef {
  id: DayId;
  dayLabel: string; // e.g. "Wednesday"
  tabLabel: string; // e.g. "GitHub Setup"
  kind: "form" | "guide";
  guide?: GuideContent; // present when kind === "guide"
}

// --- Data types: MIRROR of backend/src/types.ts (the canonical contract) ---
// ADR-0007: the backend owns the data contract; this file must match it
// field-for-field on the shared properties. The ONLY allowed differences are
// client-only additions, marked "client-only" below, that reflect the API
// response shape (fields the server adds) or UI convenience:
//   - Team/PromptLog `key?`     — present on admin roster/prompt responses
//   - Team/PromptLog `ts?`      — set by the server; absent in submit payloads
//   - Cohort `createdAt?/archived?` — full on the admin index, partial elsewhere
//   - Cohort `teamCount?/promptCount?` — only on GET /api/admin/cohorts
// Keep this in sync by hand; nothing automated enforces it.

export interface Member {
  name: string;
  linkedin: string; // http(s) URL or "" (server sanitizes on write, RNF-012)
  isPM: boolean;
}

export interface Team {
  teamName: string;
  idea: string;
  members: Member[];
  ts?: number; // client-only: server-set timestamp, absent in submit payloads
  // client-only: storage key ("cohort:<id>:team:<ts>_<uuid>"), present on admin
  // roster responses so a single submission can be deleted individually.
  key?: string;
}

export interface PromptLog {
  teamName: string;
  idea: string;
  docUrl: string;
  ts?: number; // client-only: server-set timestamp
  // client-only: storage key ("cohort:<id>:prompt:<ts>_<uuid>"), present on
  // admin prompt responses so a single submission can be deleted individually.
  key?: string;
}

// A cohort is one isolated data box (group / edition). Student links carry its
// id as "?grupo=<id>".
export interface Cohort {
  id: string;
  label: string;
  createdAt?: number; // client-only: partial on student responses ({id,label})
  archived?: boolean; // client-only: partial on student responses
  // client-only: present on the admin cohort index (GET /api/admin/cohorts).
  teamCount?: number;
  promptCount?: number;
}
