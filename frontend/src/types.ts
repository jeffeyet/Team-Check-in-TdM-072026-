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
