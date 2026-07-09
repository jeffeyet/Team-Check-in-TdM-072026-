import { useState } from "react";
import type { View, AdminTab } from "./types";
import Day1 from "./views/Day1";
import Day2 from "./views/Day2";
import Admin from "./views/Admin";

export default function App() {
  // Defaults to today: Tuesday (day2), matching the original SPA.
  const [view, setView] = useState<View>("day2");
  const [unlocked, setUnlocked] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminTab, setAdminTab] = useState<AdminTab>("prompts");

  // The header switch toggles between instructor view and the day-2 form.
  const onSwitch = () => setView(view === "admin" ? "day2" : "admin");
  const onSelectDay = (v: "day1" | "day2") => setView(v);

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
  if (view === "day1") {
    return <Day1 view={view} onSelectDay={onSelectDay} onSwitch={onSwitch} />;
  }
  return <Day2 view={view} onSelectDay={onSelectDay} onSwitch={onSwitch} />;
}
