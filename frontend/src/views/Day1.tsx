import { useState } from "react";
import type { View, DayId, Cohort } from "../types";
import { Header, DayTabs, ConfirmScreen } from "../ui";
import { submitTeam } from "../api";

const MAX_MEMBERS = 6;

interface Row {
  id: number;
  name: string;
  linkedin: string;
  isPM: boolean;
}

let seq = 0;
function newRow(): Row {
  return { id: seq++, name: "", linkedin: "", isPM: false };
}
function initialRows(): Row[] {
  return [newRow(), newRow(), newRow()];
}

export default function Day1({
  view,
  onSelectDay,
  onSwitch,
  cohort,
}: {
  view: View;
  onSelectDay: (v: DayId) => void;
  onSwitch: () => void;
  cohort: Cohort;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [teamName, setTeamName] = useState("");
  const [idea, setIdea] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState("");
  const [doneCount, setDoneCount] = useState(0);

  const n = rows.length;

  function addRow() {
    if (rows.length >= MAX_MEMBERS) return;
    setRows((r) => [...r, newRow()]);
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  }
  function setName(id: number, v: string) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, name: v } : x)));
  }
  function setLinkedin(id: number, v: string) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, linkedin: v } : x)));
  }
  function setPM(id: number, checked: boolean) {
    // Single-PM rule: checking one clears the others.
    setRows((r) =>
      r.map((x) =>
        x.id === id ? { ...x, isPM: checked } : checked ? { ...x, isPM: false } : x
      )
    );
  }

  async function submit() {
    setMsg("");
    const members = rows
      .map((r) => ({
        name: r.name.trim(),
        linkedin: r.linkedin.trim(),
        isPM: r.isPM,
      }))
      .filter((m) => m.name);
    const tn = teamName.trim();
    const id = idea.trim();
    if (!tn) {
      setMsg("Please add a team name.");
      return;
    }
    if (members.length === 0) {
      setMsg("Add at least one team member.");
      return;
    }
    if (!id) {
      setMsg("Add your one-sentence idea.");
      return;
    }
    setBusy(true);
    try {
      await submitTeam(cohort.id, { teamName: tn, members, idea: id });
      setDoneName(tn);
      setDoneCount(members.length);
      setDone(true);
    } catch {
      setMsg("Something went wrong. Try once more.");
      setBusy(false);
    }
  }

  function reset() {
    setRows(initialRows());
    setTeamName("");
    setIdea("");
    setMsg("");
    setBusy(false);
    setDone(false);
  }

  if (done) {
    return (
      <ConfirmScreen
        title={doneName + " is checked in."}
        sub={doneCount + " member(s) on the board."}
        againLabel="Submit another team"
        onAgain={reset}
        view={view}
        onSwitch={onSwitch}
        group={cohort.label}
      />
    );
  }

  return (
    <div className="wrap">
      <Header
        sub="One person per team: add your name, teammates, and your idea."
        view={view}
        onSwitch={onSwitch}
        group={cohort.label}
      />
      <DayTabs view={view} onSelect={onSelectDay} />
      <div className="card">
        <div className="field">
          <label className="lab" htmlFor="f-team">
            Team name <span className="req">*</span>
          </label>
          <input
            type="text"
            id="f-team"
            placeholder="e.g. Studybuddy"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lab">
            Team members <span className="req">*</span>
            <span className="hint">
              up to six &mdash; check one box for your first PM
            </span>
          </label>
          <div className="members" id="members">
            {rows.map((r) => (
              <div className="mrow" key={r.id}>
                <input
                  type="text"
                  className="m-name"
                  placeholder="Full name"
                  autoComplete="off"
                  value={r.name}
                  onChange={(e) => setName(r.id, e.target.value)}
                />
                <input
                  type="url"
                  className="m-ln"
                  placeholder="LinkedIn URL (optional)"
                  autoComplete="off"
                  value={r.linkedin}
                  onChange={(e) => setLinkedin(r.id, e.target.value)}
                />
                <span className="pmbox">
                  <input
                    type="checkbox"
                    className="m-pm"
                    id={"pm-r" + r.id}
                    checked={r.isPM}
                    onChange={(e) => setPM(r.id, e.target.checked)}
                  />
                  <label htmlFor={"pm-r" + r.id}>PM</label>
                </span>
                <button
                  type="button"
                  className="rm"
                  title="Remove"
                  style={{ visibility: n > 1 ? "visible" : "hidden" }}
                  onClick={() => removeRow(r.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="addrow">
            <button
              type="button"
              className="addbtn"
              id="addm"
              disabled={n >= MAX_MEMBERS}
              onClick={addRow}
            >
              + Add teammate
            </button>
            <span className="addnote" id="addnote">
              {n >= MAX_MEMBERS ? "Maximum of six." : n + " of " + MAX_MEMBERS}
            </span>
          </div>
        </div>
        <div className="field">
          <label className="lab" htmlFor="f-idea">
            Your idea, in one sentence <span className="req">*</span>
          </label>
          <textarea
            id="f-idea"
            maxLength={240}
            placeholder="A study tool that turns lecture notes into a five-question quiz."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <div className="countrow">
            <span className="count" id="count">
              {idea.length} / 240
            </span>
            <span className="count">one thing, done well</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          id="submit"
          disabled={busy}
          onClick={submit}
        >
          {busy ? "Checking in..." : "Check in our team"}
        </button>
        <div className={"msg" + (msg ? " err" : "")} id="msg">
          {msg}
        </div>
      </div>
      <div className="foot">
        Your entry is shared with the instructor for this program only.
      </div>
    </div>
  );
}
