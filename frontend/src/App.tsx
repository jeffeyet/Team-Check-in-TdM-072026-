import { useEffect, useState } from "react";
import type { View, DayId, AdminTab, Cohort } from "./types";
import { getCohort } from "./api";
import { GroupGate, LoadingScreen } from "./ui";
import Day1 from "./views/Day1";
import Day2 from "./views/Day2";
import Guide from "./views/Guide";
import Admin from "./views/Admin";

type CohortState = "loading" | "ok" | "missing";

function readGrupo(): string {
  return (new URLSearchParams(window.location.search).get("grupo") || "").trim();
}

export default function App() {
  // Defaults to today: Tuesday (day2), matching the original SPA.
  const [view, setView] = useState<View>("day2");
  const [unlocked, setUnlocked] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminTab, setAdminTab] = useState<AdminTab>("prompts");

  // Student cohort, driven by the "?grupo=<id>" URL param.
  const [grupo, setGrupoState] = useState<string>(readGrupo);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [cohortState, setCohortState] = useState<CohortState>("loading");
  // true once a code has been tried (so the gate can show "not found").
  const [tried, setTried] = useState<boolean>(() => !!readGrupo());

  // Writes "?grupo=<id>" without a full reload, then re-verifies.
  function setGrupo(id: string) {
    const clean = id.trim();
    const url = new URL(window.location.href);
    if (clean) url.searchParams.set("grupo", clean);
    else url.searchParams.delete("grupo");
    window.history.replaceState({}, "", url.toString());
    setTried(!!clean);
    setGrupoState(clean);
  }

  // Verify the cohort whenever the group changes (student views only).
  useEffect(() => {
    if (view === "admin") return;
    if (!grupo) {
      setCohort(null);
      setCohortState("missing");
      return;
    }
    let alive = true;
    setCohortState("loading");
    getCohort(grupo).then((c) => {
      if (!alive) return;
      if (c) {
        setCohort(c);
        setCohortState("ok");
      } else {
        setCohort(null);
        setCohortState("missing");
      }
    });
    return () => {
      alive = false;
    };
  }, [grupo, view]);

  // The header switch toggles between instructor view and the day-2 form.
  const onSwitch = () => setView(view === "admin" ? "day2" : "admin");
  const onSelectDay = (v: DayId) => setView(v);

  if (view === "admin") {
    return (
      <Admin
        view={view}
        onSwitch={onSwitch}
        unlocked={unlocked}
        setUnlocked={setUnlocked}
        adminCode={adminCode}
        setAdminCode={setAdminCode}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
      />
    );
  }

  // Student views require a valid, live cohort.
  if (cohortState === "loading") {
    return <LoadingScreen view={view} onSwitch={onSwitch} />;
  }
  if (cohortState !== "ok" || !cohort) {
    return (
      <GroupGate
        view={view}
        onSwitch={onSwitch}
        onSubmit={setGrupo}
        notFound={tried}
      />
    );
  }

  if (view === "day1") {
    return (
      <Day1
        view={view}
        onSelectDay={onSelectDay}
        onSwitch={onSwitch}
        cohort={cohort}
      />
    );
  }
  if (view === "day3") {
    return (
      <Guide
        view={view}
        onSelectDay={onSelectDay}
        onSwitch={onSwitch}
        cohort={cohort}
      />
    );
  }
  return (
    <Day2
      view={view}
      onSelectDay={onSelectDay}
      onSwitch={onSwitch}
      cohort={cohort}
    />
  );
}
