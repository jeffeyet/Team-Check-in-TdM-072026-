import { useState } from "react";
import type { View, DayId, Cohort } from "../types";
import { Header, DayTabs } from "../ui";
import { getDay } from "../content/days";

// Generic renderer for read-only "guide" days (ADR-0005). It looks up the day
// content by `view` and paints intro, concept cards, an inline diagram, the
// external-kit steps, a "you vs the AI" table, and a readiness checklist.
// No form, no backend call, no dependency.
export default function Guide({
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
  const day = getDay(view as DayId);
  const guide = day?.guide;
  const [copied, setCopied] = useState(false);

  // A guide day is always resolvable here; guard keeps the type honest.
  if (!guide) {
    return (
      <div className="wrap">
        <Header sub="" view={view} onSwitch={onSwitch} group={cohort.label} />
        <div className="empty">
          <h2>Nothing to show here.</h2>
        </div>
      </div>
    );
  }

  function copyMessage() {
    const msg = guide!.kit.copyMessage;
    navigator.clipboard?.writeText(msg).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false)
    );
  }

  return (
    <div className="wrap">
      <Header sub={guide.sub} view={view} onSwitch={onSwitch} group={cohort.label} />
      <DayTabs view={view} onSelect={onSelectDay} />

      <div className="card guide">
        {guide.intro.map((p, i) => (
          <p className="g-intro" key={i}>
            {p}
          </p>
        ))}

        <h3 className="g-h">The words you'll hear</h3>
        <div className="g-concepts">
          {guide.concepts.map((c, i) => (
            <div className="g-concept" key={i}>
              <span className="g-emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <div>
                <div className="g-term">{c.term}</div>
                <div className="g-desc">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {guide.diagram === "git-cycle" ? (
          <>
            <h3 className="g-h">How it flows</h3>
            <GitCycle />
          </>
        ) : null}

        <h3 className="g-h">Use the kit</h3>
        <ol className="g-steps">
          {guide.kit.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <div className="g-copy">
          <code className="g-msg mono">{guide.kit.copyMessage}</code>
          <button className="btn btn-ghost btn-sm" onClick={copyMessage}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <a
          className="btn btn-primary g-kitbtn"
          href={guide.kit.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the GitHub setup kit ↗
        </a>

        <h3 className="g-h">You do vs the AI does</h3>
        <div className="g-tablewrap">
          <table className="g-table">
            <thead>
              <tr>
                <th>You do</th>
                <th>The AI does</th>
              </tr>
            </thead>
            <tbody>
              {guide.humanVsAi.map((r, i) => (
                <tr key={i}>
                  <td>{r.human}</td>
                  <td>{r.ai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="g-h">You're ready when</h3>
        <ul className="g-check">
          {guide.checklist.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>

        <p className="g-trouble">{guide.troubleshooting}</p>
      </div>

      <div className="foot">
        This guide is the same for every group. Nothing is submitted here.
      </div>
    </div>
  );
}

// Inline, dependency-free diagram of the GitHub cycle. Strokes/text use
// currentColor (inherits the theme ink); accents use the gold token via a class.
function GitCycle() {
  return (
    <div className="g-diagram" role="img" aria-label="Your computer pushes to and clones from GitHub; the change flow is commit, push, pull request, merge.">
      <svg viewBox="0 0 640 250" width="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="gc-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="currentColor" />
          </marker>
          <marker id="gc-arrow-gold" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" className="gc-gold-fill" />
          </marker>
        </defs>

        {/* Two places */}
        <rect x="30" y="24" width="200" height="72" rx="12" className="gc-box" />
        <text x="130" y="55" className="gc-label" textAnchor="middle">💻 Your computer</text>
        <text x="130" y="76" className="gc-sub" textAnchor="middle">Git tracks your files</text>

        <rect x="410" y="24" width="200" height="72" rx="12" className="gc-box" />
        <text x="510" y="55" className="gc-label" textAnchor="middle">☁️ GitHub</text>
        <text x="510" y="76" className="gc-sub" textAnchor="middle">shared online</text>

        {/* push (computer -> GitHub) */}
        <line x1="234" y1="46" x2="404" y2="46" className="gc-line-gold" markerEnd="url(#gc-arrow-gold)" />
        <text x="319" y="38" className="gc-edge gc-gold-fill" textAnchor="middle">push ⬆</text>

        {/* clone / pull (GitHub -> computer) */}
        <line x1="406" y1="74" x2="236" y2="74" className="gc-line" markerEnd="url(#gc-arrow)" />
        <text x="319" y="92" className="gc-edge" textAnchor="middle">clone / pull ⬇</text>

        {/* change flow */}
        <text x="320" y="150" className="gc-flowhead" textAnchor="middle">The change flow</text>
        {(
          [
            ["💾 commit", 70],
            ["⬆ push", 220],
            ["🔀 pull request", 385],
            ["✅ merge", 545],
          ] as [string, number][]
        ).map(([label, cx], i, arr) => (
          <g key={label}>
            <rect x={cx - 58} y="176" width="116" height="40" rx="9" className="gc-pill" />
            <text x={cx} y="200" className="gc-pilltext" textAnchor="middle">{label}</text>
            {i < arr.length - 1 ? (
              <line
                x1={cx + 60}
                y1="196"
                x2={arr[i + 1][1] - 62}
                y2="196"
                className="gc-line"
                markerEnd="url(#gc-arrow)"
              />
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
