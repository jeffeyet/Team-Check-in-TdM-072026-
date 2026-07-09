import React from "react";
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
}: {
  sub: string;
  view: View;
  onSwitch: () => void;
}) {
  return (
    <header>
      <div className="brand">
        <div className="eyebrow">
          AI Leadership Intensive &middot; Berkeley Innovation Group
        </div>
        <h1>Course Portal</h1>
        <p>{sub}</p>
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
}: {
  title: string;
  sub: string;
  againLabel: string;
  onAgain: () => void;
  view: View;
  onSwitch: () => void;
}) {
  return (
    <div className="wrap">
      <Header sub="" view={view} onSwitch={onSwitch} />
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
