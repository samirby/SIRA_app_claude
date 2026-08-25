"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DashboardTask = {
  id: number;
  title: string;
  subjectName: string | null;
  dueDate: string | null;
};

type TabKey = "today" | "tomorrow" | "all";

export function DashboardTaskTabs({
  today,
  tomorrow,
  all,
}: {
  today: DashboardTask[];
  tomorrow: DashboardTask[];
  all: DashboardTask[];
}) {
  const [active, setActive] = useState<TabKey>("today");
  const rows = useMemo(() => active === "today" ? today : active === "tomorrow" ? tomorrow : all, [active, today, tomorrow, all]);
  const emptyText = active === "today"
    ? ["Nuk ka detyra për sot", "Shto një detyrë të re ose caktoja datën e sotme."]
    : active === "tomorrow"
      ? ["Nuk ka detyra për nesër", "Detyrat me afat nesër do të shfaqen këtu."]
      : ["Nuk ka detyra aktive", "Të gjitha detyrat e hapura do të shfaqen këtu."];

  return <>
    <div className="taskCounters" role="tablist" aria-label="Filtro detyrat">
      <button type="button" role="tab" aria-selected={active === "today"} className={active === "today" ? "active" : ""} onClick={() => setActive("today")}>Sot <b>{today.length}</b></button>
      <button type="button" role="tab" aria-selected={active === "tomorrow"} className={active === "tomorrow" ? "active" : ""} onClick={() => setActive("tomorrow")}>Nesër <b>{tomorrow.length}</b></button>
      <button type="button" role="tab" aria-selected={active === "all"} className={active === "all" ? "active" : ""} onClick={() => setActive("all")}>Të gjitha <b>{all.length}</b></button>
    </div>
    {rows.length ? <div className="dashboardTaskRows">
      {rows.slice(0, 5).map((t) => <Link href={`/tasks/${t.id}`} key={t.id}><strong>{t.title}</strong><span>{t.subjectName || "Pa klient"}</span></Link>)}
      {rows.length > 5 && <Link href="/tasks" className="dashboardTaskMore"><strong>+ {rows.length - 5} detyra tjera</strong><span>Shiko të gjitha →</span></Link>}
    </div> : <div className="successEmpty"><b>✓</b><div><strong>{emptyText[0]}</strong><small>{emptyText[1]}</small></div></div>}
  </>;
}
