import React, { useState } from "react";
import type { View, DayId } from "./types";
import { DAYS } from "./content/days";

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
  onSelect: (v: DayId) => void;
}) {
  // Tabs are rendered from the day catalog (content/days.ts); adding a day is a
  // data edit, not a new tab here (ADR-0005).
  return (
    <div className="daytabs" role="tablist">
      {DAYS.map((d) => (
        <div
          className={"daytab " + (view === d.id ? "active" : "")}
          id={"tab-" + d.id}
          role="tab"
          tabIndex={0}
          key={d.id}
          aria-selected={view === d.id}
          onClick={() => onSelect(d.id)}
          onKeyDown={keyActivate(() => onSelect(d.id))}
        >
          <span className="d">{d.dayLabel}</span>
          {d.tabLabel}
        </div>
      ))}
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
