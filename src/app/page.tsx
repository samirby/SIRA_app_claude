import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getProjects } from "@/modules/projects/project.service";
import { getTasks } from "@/modules/tasks/task.service";
import { getContracts } from "@/modules/contracts/contract.service";
import { ticketDashboardStats } from "@/modules/tickets/ticket.repository";
import { DashboardTaskTabs } from "@/components/dashboard-task-tabs";

export const dynamic = "force-dynamic";
function euro(v:number){return new Intl.NumberFormat("de-AT",{style:"currency",currency:"EUR"}).format(v)}
function dateLabel(value:string|null){if(!value)return "—";return new Intl.DateTimeFormat("sq-AL",{day:"2-digit",month:"short"}).format(new Date(`${value}T12:00:00`))}
function dueDays(value:string|null){if(!value)return null;const now=new Date();now.setHours(12,0,0,0);return Math.ceil((new Date(`${value}T12:00:00`).getTime()-now.getTime())/86400000)}

export default async function Page(){
 const [projects,tasks,contracts,ticketStats]=await Promise.all([
  getProjects(true).catch(()=>[]), getTasks().catch(()=>[]), getContracts().catch(()=>[]), ticketDashboardStats().catch(()=>({NEW:0,IN_PROGRESS:0,WAITING_CLIENT:0,CLOSED:0})),
 ]);
 const today=new Date().toISOString().slice(0,10);
 const activeProjects=projects.filter(p=>p.status==="OPEN"||p.status==="IN_PROGRESS");
 const todayTasks=tasks.filter(t=>t.status!=="COMPLETED"&&t.dueDate===today);
 const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const tomorrowTasks=tasks.filter(t=>t.status!=="COMPLETED"&&t.dueDate===tomorrow);
 const allOpenTasks=tasks.filter(t=>t.status!=="COMPLETED");
 const urgentToday=todayTasks.filter(t=>t.priority==="URGENT").length;
 const monthKey=today.slice(0,7);
 const monthMinutes=tasks.reduce((sum,t)=>sum+(t.timeEntries??[]).filter(e=>e.workDate?.startsWith(monthKey)).reduce((s,e)=>s+e.minutes,0),0);
 const pendingBilling=tasks.filter(t=>t.billingStatus==="PENDING").reduce((s,t)=>s+t.billingTotal+t.billableExtraCostTotal,0)+projects.filter(p=>p.billingStatus==="PENDING").reduce((s,p)=>s+p.billingTotal,0);
 const dueContracts=contracts.filter(c=>{const d=dueDays(c.endDate);return c.status==="ACTIVE"&&d!==null&&d>=0&&d<=c.reminderDays}).sort((a,b)=>(a.endDate??"").localeCompare(b.endDate??""));
 return <AppShell title="Dashboard" subtitle="Përmbledhja e punës së SIRA Solutions." hidePageHeader>
  <section className="dashboardMetrics">
   <Link href="/projects"><span className="metricIcon blue">◇</span><div><small>Projektet aktive</small><strong>{activeProjects.length}</strong><em>{activeProjects.length} projekte në zhvillim</em></div></Link>
   <Link href="/tasks"><span className="metricIcon orange">✓</span><div><small>Detyrat për sot</small><strong>{todayTasks.length}</strong><em className="orangeText">{urgentToday} urgjente</em></div></Link>
   <Link href="/tasks"><span className="metricIcon green">◷</span><div><small>Orët këtë muaj</small><strong>{(monthMinutes/60).toFixed(1)}</strong><em>Koha e regjistruar</em></div></Link>
   <Link href="/invoices"><span className="metricIcon purple">€</span><div><small>Pret faturim</small><strong>{euro(pendingBilling)}</strong><em>{tasks.filter(t=>t.billingStatus==="PENDING").length+projects.filter(p=>p.billingStatus==="PENDING").length} punë presin faturim</em></div></Link>
  </section>

  <section className="ticketStrip"><div className="ticketBrand"><span>⌁</span><strong>TICKETS</strong></div><div><small>Në pritje / New</small><b>{ticketStats.NEW}</b></div><div><small>Open / Duke u punuar</small><b>{ticketStats.IN_PROGRESS + ticketStats.WAITING_CLIENT}</b></div><div><small>Të zgjidhura / Mbyllura</small><b>{ticketStats.CLOSED}</b></div><Link href="/tickets">Shiko të gjitha →</Link></section>

  <section className="dashboardMainGrid">
   <article className="dashboardPanel projectsPanel"><header><div><h2>Projektet aktive</h2><p>Progresi i projekteve aktuale</p></div><Link href="/projects">Shiko të gjitha →</Link></header><div className="dashboardProjectList">{activeProjects.slice(0,5).map(p=>{const progress=p.taskCount?Math.round((p.completedTaskCount/p.taskCount)*100):0;return <Link href={`/projects/${p.id}`} key={p.id}><span className="projectAvatar">{p.name.slice(0,1).toUpperCase()}</span><div className="projectName"><strong>{p.name}</strong><small>{p.clientName||"Pa klient"}</small></div><div className="projectProgress"><small>Progresi <b>{progress}%</b></small><i><span style={{width:`${progress}%`}}/></i></div><span className="statusPill active">Aktiv</span><div className="projectDue"><small>Afati</small><strong>{dateLabel(p.dueDate)}</strong></div></Link>})}{!activeProjects.length&&<div className="dashboardEmpty">Nuk ka projekte aktive.</div>}</div></article>
   <article className="dashboardPanel incomePanel"><header><div><h2>Të ardhurat</h2><p>Përmbledhje operative</p></div><Link href="/finance">Shiko financat →</Link></header><div className="incomeBody"><small>Pret faturim</small><strong>{euro(pendingBilling)}</strong><span>{projects.filter(p=>p.billingStatus==="PENDING").length+tasks.filter(t=>t.billingStatus==="PENDING").length} zëra në pritje</span><div className="miniBars">{[18,35,28,52,44,66].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></article>
  </section>

  <section className="dashboardBottomGrid">
   <article className="dashboardPanel taskPanel"><header><div><h2>Detyrat</h2><p>{new Intl.DateTimeFormat("sq-AL",{dateStyle:"full"}).format(new Date())}</p></div><Link href="/tasks">+ Shto detyrë</Link></header><DashboardTaskTabs today={todayTasks.map(t=>({id:t.id,title:t.title,subjectName:t.subjectName,dueDate:t.dueDate}))} tomorrow={tomorrowTasks.map(t=>({id:t.id,title:t.title,subjectName:t.subjectName,dueDate:t.dueDate}))} all={allOpenTasks.map(t=>({id:t.id,title:t.title,subjectName:t.subjectName,dueDate:t.dueDate}))}/></article>
   <article className="dashboardPanel contractDuePanel"><header><div><h2>Kontratat që skadojnë</h2><p>Paralajmërime sipas afatit të kontratës</p></div><Link href="/contracts">Shiko të gjitha →</Link></header>{dueContracts.length?<div className="dueContractRows">{dueContracts.slice(0,4).map(c=><Link href="/contracts" key={c.id}><div><strong>{c.title}</strong><small>{c.clientName||"SIRA Solutions"}</small></div><span>{dueDays(c.endDate)} ditë</span></Link>)}</div>:<div className="successEmpty"><b>✓</b><div><strong>Nuk ka skadime të afërta</strong><small>Të gjitha kontratat janë në rregull.</small></div></div>}</article>
  </section>
 </AppShell>
}
