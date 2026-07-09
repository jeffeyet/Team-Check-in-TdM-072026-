import React, { useState } from "react";
import type { View } from "./types";

// Enter/Space activates a non-button element acting as a control.
function keyActivate(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

export function Header({
  sub,
  view,
  onSwitch,
  group,
}: {
  sub: string;
  view: View;
  onSwitch: () => void;
  // Optional cohort/group label shown under the title on the student views.
  group?: string;
}) {
  return (
    <header>
      <div className="brand">
        <div className="eyebrow">
          AI Leadership Intensive &middot; Berkeley Innovation Group
        </div>
        <h1>Course Portal</h1>
        {group ? (
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Group: {group}
          </div>
        ) : null}
        {sub ? <p>{sub}</p> : null}
      </div>
      <button className="viewlink" id="switch" onClick={onSwitch}>
        {view === "admin" ? "← Back" : "Instructor view →"}
      </button>
    </header>
  );
}

export function DayTabs({
  view,
  onSelect,
}: {
  view: View;
  onSelect: (v: "day1" | "day2") => void;
}) {
  return (
    <div className="daytabs" role="tablist">
      <div
        className={"daytab " + (view === "day1" ? "active" : "")}
        id="tab-day1"
        role="tab"
        tabIndex={0}
        aria-selected={view === "day1"}
        onClick={() => onSelect("day1")}
        onKeyDown={keyActivate(() => onSelect("day1"))}
      >
        <span className="d">Monday</span>Team Check-In
      </div>
      <div
        className={"daytab " + (view === "day2" ? "active" : "")}
        id="tab-day2"
        role="tab"
        tabIndex={0}
        aria-selected={view === "day2"}
        onClick={() => onSelect("day2")}
        onKeyDown={keyActivate(() => onSelect("day2"))}
      >
        <span className="d">Tuesday</span>Prompt Log
      </div>
    </div>
  );
}

export function ConfirmScreen({
  title,
  sub,
  againLabel,
  onAgain,
  view,
  onSwitch,
  group,
}: {
  title: string;
  sub: string;
  againLabel: string;
  onAgain: () => void;
  view: View;
  onSwitch: () => void;
  group?: string;
}) {
  return (
    <div className="wrap">
      <Header sub="" view={view} onSwitch={onSwitch} group={group} />
      <div className="card confirm">
        <div className="check">{"✓"}</div>
        <h2>{title}</h2>
        <p>{sub}</p>
        <div className="row">
          <button className="btn btn-ghost btn-sm" id="again" onClick={onAgain}>
            {againLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shown to students when "?grupo=<id>" is missing or does not match a live
// cohort. Submitting the code sets "?grupo=<id>" and re-checks it.
export function GroupGate({
  view,
  onSwitch,
  onSubmit,
  notFound,
}: {
  view: View;
  onSwitch: () => void;
  onSubmit: (id: string) => void;
  // true when a code was tried but no matching (live) cohort was found.
  notFound: boolean;
}) {
  const [code, setCode] = useState("");

  function go() {
    const v = code.trim();
    if (!v) return;
    onSubmit(v);
  }

  return (
    <div className="wrap">
      <Header
        sub="Enter your group code to continue."
        view={view}
        onSwitch={onSwitch}
      />
      <div className="card gate">
        <div className="field">
          <label className="lab" htmlFor="f-grupo">
            Your group code
          </label>
          <input
            type="text"
            id="f-grupo"
            placeholder="e.g. julio-2026"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
          />
        </div>
        <button className="btn btn-primary" id="grupo-go" onClick={go}>
          Continue
        </button>
        {notFound ? (
          <div className="msg err" id="grupo-msg">
            That group code was not found. Ask your instructor for your group
            link.
          </div>
        ) : (
          <div className="msg" id="grupo-msg" />
        )}
      </div>
      <div className="foot">Ask your instructor for your group link.</div>
    </div>
  );
}

// Small loading placeholder used while a cohort is being verified.
export function LoadingScreen({
  view,
  onSwitch,
}: {
  view: View;
  onSwitch: () => void;
}) {
  return (
    <div className="wrap">
      <Header sub="" view={view} onSwitch={onSwitch} />
      <div className="empty">
        <h2>Loading...</h2>
      </div>
    </div>
  );
}
