import { useEffect, useState } from "react";
import type { View, AdminTab, Team, PromptLog, Cohort } from "../types";
import { Header } from "../ui";
import {
  listCohorts,
  createCohort,
  archiveCohort,
  patchCohort,
  getCohortRoster,
  getCohortPrompts,
  deleteSubmission,
  migrateLegacy,
  exportTeamsCsv,
  exportPromptsCsv,
  downloadBackup,
  copyText,
  shareLink,
} from "../api";

function keyActivate(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

// ============================ PASSCODE GATE ============================

function Gate({
  onUnlock,
  onSwitch,
  view,
}: {
  onUnlock: (code: string, cohorts: Cohort[]) => void;
  onSwitch: () => void;
  view: View;
}) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function go() {
    setMsg("");
    const c = code.trim();
    if (!c) return;
    try {
      const cohorts = await listCohorts(c);
      if (cohorts === null) {
        setMsg("That passcode did not match.");
        return;
      }
      onUnlock(c, cohorts);
    } catch (e) {
      setMsg((e as Error).message || "Could not reach the server.");
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

// ============================ SHARE LINK ============================

function ShareLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const link = shareLink(id);

  async function copy() {
    const ok = await copyText(link);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="toolbar" style={{ marginBottom: 0 }}>
      <input
        type="text"
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        style={{ flex: 1, minWidth: 200, fontSize: 13 }}
      />
      <button className="btn btn-ghost btn-sm" onClick={copy}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

// ============================ ALL COHORTS VIEW ============================

function CohortsView({
  code,
  cohorts,
  onRefresh,
  onOpen,
}: {
  code: string;
  cohorts: Cohort[];
  onRefresh: () => void;
  onOpen: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function create() {
    setMsg("");
    const lb = label.trim();
    if (!lb) {
      setMsg("Add a group name.");
      return;
    }
    setBusy(true);
    try {
      await createCohort(code, lb);
      setLabel("");
      onRefresh();
    } catch (e) {
      setMsg((e as Error).message || "Could not create the group.");
    } finally {
      setBusy(false);
    }
  }

  async function doArchive(cid: string) {
    if (
      !window.confirm(
        "Archive this group? It will be hidden from students and its link " +
          "stops working. Its data is kept and you can unarchive it anytime."
      )
    )
      return;
    try {
      await archiveCohort(code, cid);
      onRefresh();
    } catch (e) {
      window.alert((e as Error).message || "Archive failed.");
    }
  }

  async function doUnarchive(cid: string) {
    try {
      await patchCohort(code, cid, { archived: false });
      onRefresh();
    } catch (e) {
      window.alert((e as Error).message || "Unarchive failed.");
    }
  }

  async function doMigrate(cid: string) {
    if (
      !window.confirm(
        "Import legacy (unassigned) submissions into this group? " +
          "This moves old team:* / prompt:* records."
      )
    )
      return;
    try {
      const moved = await migrateLegacy(code, cid);
      window.alert(moved + " record(s) imported.");
      onRefresh();
    } catch (e) {
      window.alert((e as Error).message || "Import failed.");
    }
  }

  async function doBackup() {
    try {
      await downloadBackup(code);
    } catch (e) {
      window.alert((e as Error).message || "Backup failed.");
    }
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
          ↻ Refresh
        </button>
        <span className="spacer"></span>
        <button className="btn btn-ghost btn-sm" onClick={doBackup}>
          Download backup (JSON)
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <label className="lab" htmlFor="c-label">
            New group name <span className="req">*</span>
            <span className="hint">you'll get a link to share with students</span>
          </label>
          <input
            type="text"
            id="c-label"
            placeholder="e.g. July 2026"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={create}
        >
          {busy ? "Creating..." : "Create group"}
        </button>
        <div className={"msg" + (msg ? " err" : "")}>{msg}</div>
      </div>

      {cohorts.length === 0 ? (
        <div className="empty">
          <h2>No groups yet</h2>
          <p>Create a group above, then share its link with students.</p>
        </div>
      ) : (
        cohorts.map((c) => (
          <div className="team" key={c.id}>
            <div className="team-head">
              <span className="team-tag mono">{c.label}</span>
              <span
                className="team-count"
                style={{ color: c.archived ? "var(--muted)" : "var(--go)" }}
              >
                {c.archived ? "Archived" : "Active"}
              </span>
              <span className="spacer"></span>
              <span className="team-count">
                {c.teamCount ?? 0} team(s) &middot; {c.promptCount ?? 0}{" "}
                prompt(s)
              </span>
            </div>
            {!c.archived ? (
              <>
                <div className="count" style={{ marginBottom: 6 }}>
                  Share this link with the group's students:
                </div>
                <ShareLink id={c.id} />
              </>
            ) : null}
            <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onOpen(c.id)}
              >
                Open
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => doMigrate(c.id)}
              >
                Import legacy
              </button>
              <span className="spacer"></span>
              {c.archived ? (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => doUnarchive(c.id)}
                >
                  Unarchive
                </button>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--danger)", borderColor: "#e7cccc" }}
                  onClick={() => doArchive(c.id)}
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ============================ TEAMS TAB ============================

function TeamsTab({
  teams,
  loading,
  onRefresh,
  onExport,
  onDelete,
}: {
  teams: Team[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onDelete: (key: string) => void;
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
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
          ↻ Refresh
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onExport}>
          Export CSV
        </button>
      </div>
      {teams.map((t, ti) => {
        const mem = t.members || [];
        return (
          <div className="team" key={t.key || ti}>
            <div className="team-head">
              <span className="team-tag mono">{t.teamName}</span>
              <span className="team-count">{mem.length} member(s)</span>
              <span className="spacer"></span>
              {t.key ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--danger)", borderColor: "#e7cccc" }}
                  onClick={() => onDelete(t.key as string)}
                >
                  Delete
                </button>
              ) : null}
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

// ============================ PROMPTS TAB ============================

function PromptsTab({
  logs,
  loading,
  onRefresh,
  onExport,
  onDelete,
}: {
  logs: PromptLog[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onDelete: (key: string) => void;
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
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
          ↻ Refresh
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onExport}>
          Export CSV
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
                <li key={l.key || li}>
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
                  {l.key ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{
                        color: "var(--danger)",
                        borderColor: "#e7cccc",
                      }}
                      onClick={() => onDelete(l.key as string)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

// ============================ COHORT DETAIL ============================

function CohortDetail({
  code,
  cohort,
  adminTab,
  setAdminTab,
  onBack,
}: {
  code: string;
  cohort: Cohort;
  adminTab: AdminTab;
  setAdminTab: (v: AdminTab) => void;
  onBack: () => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<PromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    if (adminTab === "teams") {
      getCohortRoster(code, cohort.id).then((t) => {
        if (alive) {
          setTeams(t);
          setLoading(false);
        }
      });
    } else {
      getCohortPrompts(code, cohort.id).then((l) => {
        if (alive) {
          setLogs(l);
          setLoading(false);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [code, cohort.id, adminTab, tick]);

  const refresh = () => setTick((t) => t + 1);

  async function del(key: string) {
    if (!window.confirm("Delete this submission? This cannot be undone.")) return;
    try {
      await deleteSubmission(code, cohort.id, key);
      refresh();
    } catch (e) {
      window.alert((e as Error).message || "Delete failed.");
    }
  }

  async function exportTeams() {
    try {
      await exportTeamsCsv(code, cohort.id);
    } catch (e) {
      window.alert((e as Error).message || "Export failed.");
    }
  }

  async function exportPrompts() {
    try {
      await exportPromptsCsv(code, cohort.id);
    } catch (e) {
      window.alert((e as Error).message || "Export failed.");
    }
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← All groups
        </button>
        <span className="team-tag mono">{cohort.label}</span>
        {cohort.archived ? (
          <span className="team-count" style={{ color: "var(--muted)" }}>
            Archived
          </span>
        ) : null}
      </div>
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
            onExport={exportTeams}
            onDelete={del}
          />
        ) : (
          <PromptsTab
            logs={logs}
            loading={loading}
            onRefresh={refresh}
            onExport={exportPrompts}
            onDelete={del}
          />
        )}
      </div>
    </>
  );
}

// ============================ ADMIN ROOT ============================

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
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cohortTick, setCohortTick] = useState(0);

  // Reload the cohort index while unlocked and viewing the list.
  useEffect(() => {
    if (!unlocked || !adminCode) return;
    let alive = true;
    listCohorts(adminCode)
      .then((list) => {
        if (alive && list) setCohorts(list);
      })
      .catch(() => {
        /* keep last-known list on transient errors */
      });
    return () => {
      alive = false;
    };
  }, [unlocked, adminCode, cohortTick]);

  if (!unlocked) {
    return (
      <Gate
        view={view}
        onSwitch={onSwitch}
        onUnlock={(code, list) => {
          setAdminCode(code);
          setCohorts(list);
          setUnlocked(true);
        }}
      />
    );
  }

  const refreshCohorts = () => setCohortTick((t) => t + 1);
  const selected = cohorts.find((c) => c.id === selectedId) || null;

  return (
    <div className="wrap wide">
      <Header sub="Groups and submissions." view={view} onSwitch={onSwitch} />
      {selected ? (
        <CohortDetail
          code={adminCode}
          cohort={selected}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          onBack={() => {
            setSelectedId(null);
            refreshCohorts();
          }}
        />
      ) : (
        <CohortsView
          code={adminCode}
          cohorts={cohorts}
          onRefresh={refreshCohorts}
          onOpen={(id) => setSelectedId(id)}
        />
      )}
    </div>
  );
}
