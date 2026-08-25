import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSettings, SESSION_COOKIE, verifySessionToken } from "@/core/auth/session";
import { findClientById, listClients } from "@/modules/clients/client.repository";
import { listProjects } from "@/modules/projects/project.repository";
import { TicketManager } from "../tickets/ticket-manager";

function date(value:string|null){if(!value)return "Pa afat";const [year,month,day]=value.split("-");return `${day}.${month}.${year}`;}
export default async function PortalPreviewPage({searchParams}:{searchParams:Promise<{clientId?:string}>}){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;const session=await verifySessionToken(token,getAuthSettings().secret);
 if(!session||session.role!=="GLOBAL_ADMIN")redirect("/");
 const clients=await listClients(1,"","active");const params=await searchParams;const requested=Number(params.clientId||0);const selectedId=clients.some(c=>c.id===requested)?requested:(clients[0]?.id||0);
 const client=selectedId?await findClientById(1,selectedId):null;const projects=selectedId?(await listProjects(1)).filter(p=>p.clientId===selectedId):[];
 return <main className="portalPage portalPreviewPage"><div className="portalPreviewBar"><div><strong>Client Portal · Preview</strong><span>Po e shikon portalin si administrator.</span></div><form><label>Testo klientin<select name="clientId" defaultValue={String(selectedId)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="secondaryButton">Hap</button><Link href="/" className="secondaryButton">Kthehu në Dashboard</Link></form></div><header className="portalHeader"><Image src="/sira-logo-black.svg" alt="SIRA Solutions" width={560} height={180} unoptimized/><div><span>CLIENT PORTAL</span><strong>{client?.name||"Pa klient"}</strong></div></header>
  <section className="portalHero"><div><small>MIRË SE VJEN</small><h1>{client?.name||"Zgjidh një klient"}</h1><p>Këtu klienti mund të shikojë projektet, afatet dhe ticket-at e tij.</p></div><strong>{projects.length}<span>Projekte</span></strong></section>
  <section className="portalProjects"><header><h2>Projektet e mia</h2><span>Përditësuar automatikisht</span></header>{projects.length?<div className="portalProjectGrid">{projects.map(project=>{const progress=project.taskCount?Math.round(project.completedTaskCount/project.taskCount*100):0;return <article key={project.id}><div><span className={`projectStatus status-${project.status.toLowerCase()}`}>{project.status==="IN_PROGRESS"?"Në punë":project.status==="COMPLETED"?"Përfunduar":"Në pritje"}</span><small>{date(project.dueDate)}</small></div><h3>{project.name}</h3><p>{project.description||"Projekti është duke u përgatitur."}</p><footer><div><i style={{width:`${progress}%`}}/></div><strong>{progress}%</strong></footer></article>})}</div>:<div className="portalEmpty">Nuk ka ende projekte të lidhura me këtë klient.</div>}</section>
  {selectedId?<TicketManager portal previewClientId={selectedId}/>:<section className="portalProjects"><div className="portalEmpty">Regjistro një klient për të testuar Client Portal.</div></section>}
 </main>;
}
