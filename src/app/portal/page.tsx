import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSettings, SESSION_COOKIE, verifySessionToken } from "@/core/auth/session";
import { findClientById } from "@/modules/clients/client.repository";
import { listProjects } from "@/modules/projects/project.repository";
import { PortalLogout } from "./portal-logout";
import { TicketManager } from "../tickets/ticket-manager";

function date(value: string | null) { if (!value) return "Pa afat"; const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; }

export default async function ClientPortalPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, getAuthSettings().secret);
  if (!session || session.role !== "CLIENT") redirect("/");
  const client = session.clientId ? await findClientById(1, session.clientId) : null;
  const projects = session.clientId ? (await listProjects(1)).filter((project) => project.clientId === session.clientId) : [];
  return <main className="portalPage"><header className="portalHeader"><Image src="/sira-logo-black.svg" alt="SIRA Solutions" width={560} height={180} unoptimized/><div><span>CLIENT PORTAL</span><strong>{session.name}</strong><PortalLogout /></div></header>
    <section className="portalHero"><div><small>MIRË SE VJEN</small><h1>{client?.name || session.name}</h1><p>Këtu mund të shikosh progresin dhe afatet e projekteve të tua.</p></div><strong>{projects.length}<span>Projekte</span></strong></section>
    <section className="portalProjects"><header><h2>Projektet e mia</h2><span>Përditësuar automatikisht</span></header>{projects.length ? <div className="portalProjectGrid">{projects.map((project) => { const progress=project.taskCount?Math.round(project.completedTaskCount/project.taskCount*100):0; return <article key={project.id}><div><span className={`projectStatus status-${project.status.toLowerCase()}`}>{project.status === "IN_PROGRESS" ? "Në punë" : project.status === "COMPLETED" ? "Përfunduar" : "Në pritje"}</span><small>{date(project.dueDate)}</small></div><h3>{project.name}</h3><p>{project.description || "Projekti është duke u përgatitur."}</p><footer><div><i style={{width:`${progress}%`}}/></div><strong>{progress}%</strong></footer></article>; })}</div> : <div className="portalEmpty">Nuk ka ende projekte të lidhura me llogarinë tënde.</div>}</section>
    <TicketManager portal />
  </main>;
}
