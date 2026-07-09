import type { DayDef, DayId, GuideContent } from "../types";

// Catalog of the three student days, modeled as data (ADR-0005). Day 1 and
// Day 2 are forms (their components in views/ write cohort data); Day 3 is a
// read-only guide rendered generically by views/Guide.tsx.
//
// The Day 3 prose is copied from the external AI_GITHUB_Connection kit
// (README.md / AGENTS.md) so it matches what the AI assistant actually does —
// including the nuance that "does not provide shell access" means success.
// Nothing here is generated at runtime.

// Link to the student kit. Derived from the kit repo's git remote
// (git@github.com:erickmdgz/AI_GITHUB_Connection.git). If the repo is renamed
// or made private, update this and confirm students can open it.
const KIT_URL = "https://github.com/erickmdgz/AI_GITHUB_Connection";

const day3Guide: GuideContent = {
  sub: "Connect your computer to GitHub and clone the instructor's repo.",
  intro: [
    "Today you'll connect your computer to GitHub and clone the instructor's repository. You don't need to know the terminal — an AI assistant does the technical steps while you approve them.",
    "First, a quick map of the words you'll hear. Then the exact steps to run the setup kit.",
  ],
  concepts: [
    { emoji: "🧰", term: "Git", desc: "The tool on your computer that tracks versions of your files." },
    { emoji: "☁️", term: "GitHub", desc: "The website that stores Git projects online and shares them with your team." },
    { emoji: "📦", term: "Repository (repo)", desc: "One project's folder, tracked by Git and hosted on GitHub." },
    { emoji: "⬇️", term: "Clone", desc: "Make a full copy of a GitHub repo onto your own computer." },
    { emoji: "🍴", term: "Fork", desc: "Make your own copy of someone else's repo under your account." },
    { emoji: "🌿", term: "Branch", desc: "A separate line of work so your changes don't disturb the main version." },
    { emoji: "💾", term: "Commit", desc: "A saved snapshot of your changes, with a short message." },
    { emoji: "⬆️", term: "Push", desc: "Send your commits from your computer up to GitHub." },
    { emoji: "🔀", term: "Pull request (PR)", desc: "Ask to merge your branch into the main one, so teammates review first." },
    { emoji: "✅", term: "Merge", desc: "Combine the reviewed changes into the main branch." },
  ],
  diagram: "git-cycle",
  kit: {
    steps: [
      "Download the kit: on the repo page, click the green “<> Code” button → “Download ZIP”, then unzip it.",
      "Open that folder inside your AI app (Claude Code tab, ChatGPT Codex, Cursor, or VS Code + Copilot). On Windows with Claude, install Git for Windows first and restart.",
      "Send one message to the AI — copy it from the box below.",
      "Answer the AI's questions (your GitHub email and display name) and approve each step.",
      "Done — your computer is connected. The AI can confirm with the kit's read-only check.",
    ],
    copyMessage: "Follow AGENTS.md in this project to set up my computer for GitHub.",
    url: KIT_URL,
  },
  humanVsAi: [
    { human: "Log in to github.com", ai: "Install Git if it's missing" },
    { human: "Complete two-factor authentication (2FA)", ai: "Generate your SSH key (never shares the private one)" },
    { human: "Paste your public SSH key into GitHub → Settings → SSH", ai: "Set your Git identity (name + email)" },
    { human: "Create a GitHub account if you don't have one", ai: "Run the test ssh -T git@github.com and read the result" },
    { human: "Approve each action the AI proposes", ai: "Clone the repo once you're connected" },
  ],
  checklist: [
    "ssh -T git@github.com greets you with your username — the message “does not provide shell access” means success.",
    "Git is installed (git --version works).",
    "Your Git identity is set (name and email).",
  ],
  troubleshooting:
    "If anything fails, tell your AI what happened or paste the exact error — it will re-read AGENTS.md and guide you to the fix.",
};

export const DAYS: DayDef[] = [
  { id: "day1", dayLabel: "Monday", tabLabel: "Team Check-In", kind: "form" },
  { id: "day2", dayLabel: "Tuesday", tabLabel: "Prompt Log", kind: "form" },
  { id: "day3", dayLabel: "Wednesday", tabLabel: "GitHub Setup", kind: "guide", guide: day3Guide },
];

export function getDay(id: DayId): DayDef | undefined {
  return DAYS.find((d) => d.id === id);
}
