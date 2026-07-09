import { useEffect, useState } from "react";
import type { View } from "../types";
import { Header, DayTabs, ConfirmScreen } from "../ui";
import { getTeamNames, submitPrompt } from "../api";

export default function Day2({
  view,
  onSelectDay,
  onSwitch,
}: {
  view: View;
  onSelectDay: (v: "day1" | "day2") => void;
  onSwitch: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [idea, setIdea] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState("");

  useEffect(() => {
    getTeamNames().then(setNames);
  }, []);

  async function submit() {
    setMsg("");
    const tn = teamName.trim();
    const du = docUrl.trim();
    const id = idea.trim();
    if (!tn) {
      setMsg("Please add your team name.");
      return;
    }
    if (!du) {
      setMsg("Paste your Google Doc link.");
      return;
    }
    if (!id) {
      setMsg("Add your revised one-sentence idea.");
      return;
    }
    setBusy(true);
    try {
      await submitPrompt({ teamName: tn, idea: id, docUrl: du });
      setDoneName(tn);
      setDone(true);
    } catch {
      setMsg("Something went wrong. Try once more.");
      setBusy(false);
    }
  }

  function reset() {
    setTeamName("");
    setDocUrl("");
    setIdea("");
    setMsg("");
    setBusy(false);
    setDone(false);
  }

  if (done) {
    return (
      <ConfirmScreen
        title={doneName + " is in."}
        sub="Your prompt log and revised idea are submitted."
        againLabel="Submit another"
        onAgain={reset}
        view={view}
        onSwitch={onSwitch}
      />
    );
  }

  return (
    <div className="wrap">
      <Header
        sub="Log your 20-prompt session and your revised idea."
        view={view}
        onSwitch={onSwitch}
      />
      <DayTabs view={view} onSelect={onSelectDay} />
      <div className="card">
        <div className="field">
          <label className="lab" htmlFor="p-team">
            Team name <span className="req">*</span>
          </label>
          <input
            type="text"
            id="p-team"
            list="teamlist"
            placeholder="Your team from Monday"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <datalist id="teamlist">
            {names.map((nm, i) => (
              <option value={nm} key={i} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label className="lab" htmlFor="p-doc">
            Google Doc link &mdash; your 20 prompts <span className="req">*</span>
          </label>
          <input
            type="url"
            id="p-doc"
            placeholder="https://docs.google.com/document/d/..."
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
          <div className="countrow">
            <span className="count">
              Set sharing to &ldquo;Anyone with the link can view&rdquo; so the
              instructor can open it.
            </span>
          </div>
        </div>
        <div className="field">
          <label className="lab" htmlFor="p-idea">
            Your revised idea, in one sentence <span className="req">*</span>
            <span className="hint">how it changed after 20 prompts</span>
          </label>
          <textarea
            id="p-idea"
            maxLength={240}
            placeholder="Now: a quiz tool that also flags which topics you got wrong most."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <div className="countrow">
            <span className="count" id="pcount">
              {idea.length} / 240
            </span>
            <span className="count">one thing, done well</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          id="psubmit"
          disabled={busy}
          onClick={submit}
        >
          {busy ? "Submitting..." : "Submit my prompt log"}
        </button>
        <div className={"msg" + (msg ? " err" : "")} id="pmsg">
          {msg}
        </div>
      </div>
      <div className="foot">Shared with the instructor for review.</div>
    </div>
  );
}
