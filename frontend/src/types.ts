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
}

export interface PromptLog {
  teamName: string;
  idea: string;
  docUrl: string;
  ts?: number;
}
