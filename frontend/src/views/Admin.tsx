import { useEffect, useState } from "react";
import type { View, AdminTab, Team, PromptLog } from "../types";
import { Header } from "../ui";
import {
  getRoster,
  getPromptRoster,
  clearTeams,
  clearPrompts,
  exportTeamsCsv,
  exportPromptsCsv,
} from "../api";

function keyActivate(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

function Gate({
  onUnlock,
  onSwitch,
  view,
}: {
  onUnlock: (code: string, logs: PromptLog[]) => void;
  onSwitch: () => void;
  view: View;
}) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function go() {
    setMsg("");
    try {
      const logs = await getPromptRoster(code.trim());
      if (logs === null) {
        setMsg("That passcode did not match.");
        return;
      }
      onUnlock(code.trim(), logs);
    } catch {
      setMsg("Could not reach the server.");
    }
  }

  return (
    <div className="wrap">
      <Header sub="Instructor access." view={view} onSwitch={onSwitch} />
      <div className="card gate">
        <div className="field">
          <label className="lab" htmlFor="f-code">
            Instructor passcode
          </label>
          <input
            type="text"
            id="f-code"
            placeholder="enter passcode"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
          />
        </div>
        <button className="btn btn-primary" id="unlock" onClick={go}>
          View submissions
        </button>
        <div className={"msg" + (msg ? " err" : "")} id="gmsg">
          {msg}
        </div>
      </div>
    </div>
  );
}

function TeamsTab({
  teams,
  loading,
  onRefresh,
  code,
}: {
  teams: Team[];
  loading: boolean;
  onRefresh: () => void;
  code: string;
}) {
  if (loading) {
    return (
      <div className="empty">
        <h2>Loading...</h2>
      </div>
    );
  }
  if (teams.length === 0) {
    return (
      <div className="empty">
        <h2>No team check-ins yet</h2>
        <button
          className="btn btn-ghost btn-sm"
          id="refresh"
          style={{ marginTop: "12px" }}
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
    );
  }
  const students = teams.reduce(
    (s, t) => s + (t.members ? t.members.length : 0),
    0
  );
  const pms = teams.reduce(
    (s, t) => s + (t.members ? t.members.filter((m) => m.isPM).length : 0),
    0
  );
  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="n">{teams.length}</div>
          <div className="l">Teams</div>
        </div>
        <div className="stat">
          <div className="n">{students}</div>
          <div className="l">Students</div>
        </div>
        <div className="stat">
          <div className="n">{pms}</div>
          <div className="l">PMs named</div>
        </div>
      </div>
      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" id="refresh" onClick={onRefresh}>
          ↻ Refresh
        </button>
        <button
          className="btn btn-ghost btn-sm"
          id="csv"
          onClick={() => exportTeamsCsv(code)}
        >
          Export CSV
        </button>
        <span className="spacer"></span>
        <button
          className="btn btn-ghost btn-sm"
          id="clear"
          style={{ color: "var(--danger)", borderColor: "#e7cccc" }}
          onClick={async () => {
            if (!window.confirm("Delete every team check-in?")) return;
            await clearTeams(code);
            onRefresh();
          }}
        >
          Clear teams
        </button>
      </div>
      {teams.map((t, ti) => {
        const mem = t.members || [];
        return (
          <div className="team" key={ti}>
            <div className="team-head">
              <span className="team-tag mono">{t.teamName}</span>
              <span className="team-count">{mem.length} member(s)</span>
            </div>
            <div className={"idea " + (t.idea ? "" : "none")}>
              {t.idea ? t.idea : "No idea submitted"}
            </div>
            <ul className="roster">
              {mem.map((m, mi) => (
                <li key={mi}>
                  <span>{m.name}</span>
                  {m.isPM ? <span className="pm-badge">First PM</span> : null}
                  {m.linkedin ? (
                    <a href={m.linkedin} target="_blank" rel="noopener">
                      LinkedIn ↗
                    </a>
                  ) : (
                    <span className="noln">no LinkedIn</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function PromptsTab({
  logs,
  loading,
  onRefresh,
  code,
}: {
  logs: PromptLog[];
  loading: boolean;
  onRefresh: () => void;
  code: string;
}) {
  if (loading) {
    return (
      <div className="empty">
        <h2>Loading...</h2>
      </div>
    );
  }
  if (logs.length === 0) {
    return (
      <div className="empty">
        <h2>No prompt logs yet</h2>
        <p>
          Submissions will appear here as students share their Google Doc links.
        </p>
        <button
          className="btn btn-ghost btn-sm"
          id="refresh"
          style={{ marginTop: "12px" }}
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
    );
  }
  const teamsCount = new Set(logs.map((l) => (l.teamName || "").toLowerCase()))
    .size;
  const groups: Record<string, { label: string; items: PromptLog[] }> = {};
  for (const l of logs) {
    const k = (l.teamName || "-").trim().toLowerCase();
    (groups[k] = groups[k] || { label: l.teamName, items: [] }).items.push(l);
  }
  const keys = Object.keys(groups).sort((a, b) =>
    groups[a].label.localeCompare(groups[b].label)
  );
  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="n">{logs.length}</div>
          <div className="l">Submissions</div>
        </div>
        <div className="stat">
          <div className="n">{teamsCount}</div>
          <div className="l">Teams</div>
        </div>
      </div>
      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" id="refresh" onClick={onRefresh}>
          ↻ Refresh
        </button>
        <button
          className="btn btn-ghost btn-sm"
          id="csv"
          onClick={() => exportPromptsCsv(code)}
        >
          Export CSV
        </button>
        <span className="spacer"></span>
        <button
          className="btn btn-ghost btn-sm"
          id="clear"
          style={{ color: "var(--danger)", borderColor: "#e7cccc" }}
          onClick={async () => {
            if (!window.confirm("Delete every prompt log?")) return;
            await clearPrompts(code);
            onRefresh();
          }}
        >
          Clear logs
        </button>
      </div>
      {keys.map((k) => {
        const g = groups[k];
        return (
          <div className="team" key={k}>
            <div className="team-head">
              <span className="team-tag mono">{g.label}</span>
              <span className="team-count">{g.items.length} submission(s)</span>
            </div>
            <ul className="roster">
              {g.items.map((l, li) => (
                <li key={li}>
                  <span
                    className="idea"
                    style={{
                      margin: 0,
                      border: "none",
                      padding: 0,
                      fontSize: "14px",
                    }}
                  >
                    {l.idea || ""}
                  </span>
                  {l.docUrl ? (
                    <a
                      className="doclink"
                      href={l.docUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      Open prompts ↗
                    </a>
                  ) : (
                    <span className="noln">no link</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export default function Admin({
  view,
  onSwitch,
  unlocked,
  setUnlocked,
  adminCode,
  setAdminCode,
  adminTab,
  setAdminTab,
}: {
  view: View;
  onSwitch: () => void;
  unlocked: boolean;
  setUnlocked: (v: boolean) => void;
  adminCode: string;
  setAdminCode: (v: string) => void;
  adminTab: AdminTab;
  setAdminTab: (v: AdminTab) => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<PromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    setLoading(true);
    if (adminTab === "teams") {
      getRoster(adminCode).then((t) => {
        if (alive) {
          setTeams(t);
          setLoading(false);
        }
      });
    } else {
      getPromptRoster(adminCode).then((l) => {
        if (alive) {
          setLogs(l || []);
          setLoading(false);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [unlocked, adminTab, adminCode, tick]);

  if (!unlocked) {
    return (
      <Gate
        view={view}
        onSwitch={onSwitch}
        onUnlock={(code, initialLogs) => {
          setAdminCode(code);
          setLogs(initialLogs);
          setUnlocked(true);
        }}
      />
    );
  }

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="wrap wide">
      <Header sub="Live submissions." view={view} onSwitch={onSwitch} />
      <div className="tabbar" role="tablist">
        <div
          className={"tab " + (adminTab === "teams" ? "active" : "")}
          id="at-teams"
          role="tab"
          tabIndex={0}
          aria-selected={adminTab === "teams"}
          onClick={() => setAdminTab("teams")}
          onKeyDown={keyActivate(() => setAdminTab("teams"))}
        >
          Teams (Mon)
        </div>
        <div
          className={"tab " + (adminTab === "prompts" ? "active" : "")}
          id="at-prompts"
          role="tab"
          tabIndex={0}
          aria-selected={adminTab === "prompts"}
          onClick={() => setAdminTab("prompts")}
          onKeyDown={keyActivate(() => setAdminTab("prompts"))}
        >
          Prompt logs (Tue)
        </div>
      </div>
      <div id="content">
        {adminTab === "teams" ? (
          <TeamsTab
            teams={teams}
            loading={loading}
            onRefresh={refresh}
            code={adminCode}
          />
        ) : (
          <PromptsTab
            logs={logs}
            loading={loading}
            onRefresh={refresh}
            code={adminCode}
          />
        )}
      </div>
    </div>
  );
}
