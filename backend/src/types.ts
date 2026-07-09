export interface Member {
  name: string;
  linkedin: string;
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
