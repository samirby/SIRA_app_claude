"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "COMPLETED";
interface Subtask { id: number; title: string; completed: boolean; }
interface TimeEntry { id: number; workDate: string; startTime: string | null; endTime: string | null; minutes: number; note: string | null; createdAt: string; }
interface NoteEntry { id: number; note: string; createdAt: string; }
interface ExtraCost { id: number; description: string; amount: number; costType: "INTERNAL" | "CLIENT"; billableAmount: number; costDate: string; createdAt: string; }
interface Label { id: number; name: string; color: string; }
type ProcessHistoryEntry =
  | { kind: "TIME"; id: number; description: string; createdAt: string; workDate: string; startTime: string | null; endTime: string | null; minutes: number }
  | { kind: "NOTE"; id: number; description: string; createdAt: string };
interface Task {
  id: number; title: string; description: string | null; subjectType: "CLIENT" | "PERSON";
  subjectName: string; clientId: number | null; projectId: number | null; projectName: string | null;
  projectMilestoneId: number | null; projectMilestoneName: string | null;
  projectBillingType: "INCLUDED" | "EXTRA_BILLABLE" | "NON_BILLABLE"; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: TaskStatus; startDate: string | null; dueDate: string | null; estimatedMinutes: number;
  spentMinutes: number; billable: boolean; billingType: "FIXED" | "HOURLY"; quantity: number; unitPrice: number;
  hourlyCostRate: number; vatRate: number; discountPercent: number;
  billingStatus: "NOT_BILLABLE" | "NOT_READY" | "PENDING" | "DRAFTED" | "INVOICED";
  billingTotal: number; invoiceId: number | null; invoiceNumber: string | null;
  subtasks: Subtask[]; timeEntries: TimeEntry[]; noteEntries: NoteEntry[]; extraCosts: ExtraCost[]; labels: Label[];
}

const priorityLabels = { LOW: "Ulët", NORMAL: "Normal", HIGH: "Lartë", URGENT: "Urgjent" } as const;
const statusLabels: Record<TaskStatus, string> = { NEW: "E re", IN_PROGRESS: "Në punë", WAITING: "Në pritje", COMPLETED: "Përfunduar" };
const today = new Date().toISOString().slice(0, 10);
const emptyTime = { workDate: today, startTime: "", endTime: "", note: "" };
const emptyCost = { description: "", amount: "", costType: "INTERNAL" as "INTERNAL" | "CLIENT", billableAmount: "", costDate: today };

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2)} orë`;
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("sq-AL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function formatWorkDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
function euro(value: number) { return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value); }

export function TaskDetail({ taskId }: { taskId: number }) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timeForm, setTimeForm] = useState(emptyTime);
  const [costForm, setCostForm] = useState(emptyCost);
  const [showCostForm, setShowCostForm] = useState(false);
  const [showCostList, setShowCostList] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të ngarkohet.");
      setTask(result.data);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [taskId]);

  async function request(url: string, method: string, body?: unknown) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(url, {
        method, headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Veprimi nuk mund të përfundohet.");
      if (result.data?.id === taskId) setTask(result.data);
      return result.data as Task;
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); return null; }
    finally { setSaving(false); }
  }

  async function addTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updated = await request(`/api/v1/tasks/${taskId}/time`, "POST", {
      workDate: timeForm.workDate,
      startTime: timeForm.startTime,
      endTime: timeForm.endTime,
      hours: null,
      note: timeForm.note || null,
    });
    if (updated) { setTimeForm(emptyTime); setMessage("Procesi i punës u regjistrua."); }
  }

  async function removeTimeEntry(entryId: number) {
    if (!window.confirm("Ta fshijmë këtë regjistrim kohe?")) return;
    const updated = await request(`/api/v1/tasks/${taskId}/time/${entryId}`, "DELETE");
    if (updated) setMessage("Regjistrimi i kohës u fshi.");
  }

  async function addExtraCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updated = await request(`/api/v1/tasks/${taskId}/costs`, "POST", {
      description: costForm.description,
      amount: Number(costForm.amount),
      costType: costForm.costType,
      billableAmount: costForm.costType === "CLIENT" ? Number(costForm.billableAmount) : 0,
      costDate: costForm.costDate,
    });
    if (updated) {
      setCostForm(emptyCost);
      setShowCostForm(false);
      setMessage("Kostoja shtesë u regjistrua.");
    }
  }

  async function removeExtraCost(costId: number) {
    if (!window.confirm("Ta fshijmë këtë kosto shtesë?")) return;
    const updated = await request(`/api/v1/tasks/${taskId}/costs/${costId}`, "DELETE");
    if (updated) setMessage("Kostoja shtesë u fshi.");
  }

  async function finish(mode: "NOW" | "LATER" | "NO" | "PROJECT") {
    const updated = await request(`/api/v1/tasks/${taskId}`, "PATCH", mode === "NO" ? { status: "COMPLETED", billable: false } : { status: "COMPLETED" });
    if (!updated) return;
    if (mode === "NOW") await request(`/api/v1/tasks/${taskId}/billing`, "POST");
    setShowCompletion(false); setMessage(mode === "NOW" ? "Detyra u përfundua dhe kaloi për faturim." : "Detyra u përfundua.");
  }
  async function reopen() {
    const updated = await request(`/api/v1/tasks/${taskId}`, "PATCH", { status: "IN_PROGRESS" });
    if (updated) setMessage("Detyra u rihap.");
  }

  async function queueBilling() {
    const updated = await request(`/api/v1/tasks/${taskId}/billing`, "POST");
    if (updated) setMessage("Detyra dhe shpenzimet kaluan te punët për faturim.");
  }

  async function createDraftInvoice() {
    if (!task?.clientId || task.status !== "COMPLETED") return;
    setSaving(true); setError(""); setMessage("");
    try {
      if (task.billingStatus !== "PENDING") {
        const queueResponse = await fetch(`/api/v1/tasks/${taskId}/billing`, { method: "POST" });
        const queueResult = await queueResponse.json();
        if (!queueResponse.ok || !queueResult.ok) throw new Error(queueResult?.error?.message || "Detyra nuk mund të kalojë për faturim.");
        setTask(queueResult.data);
      }
      const issueDate = new Date().toISOString().slice(0, 10);
      const due = new Date(`${issueDate}T12:00:00`); due.setDate(due.getDate() + 14);
      const invoiceResponse = await fetch("/api/v1/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: task.clientId, issueDate, dueDate: due.toISOString().slice(0, 10), notes: null, items: [{ taskId: task.id }] }),
      });
      const invoiceResult = await invoiceResponse.json();
      if (!invoiceResponse.ok || !invoiceResult.ok) throw new Error(invoiceResult?.error?.message || "Drafti i faturës nuk mund të krijohet.");
      window.location.assign(`/invoices#invoice-${invoiceResult.data.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  const extraCostTotal = useMemo(() => task?.extraCosts.reduce((total, cost) => total + cost.amount, 0) ?? 0, [task]);
  const internalCostTotal = useMemo(() => task?.extraCosts.filter((cost) => cost.costType === "INTERNAL").reduce((total, cost) => total + cost.amount, 0) ?? 0, [task]);
  const billableExtraCostTotal = useMemo(() => task?.extraCosts.reduce((total, cost) => total + cost.billableAmount, 0) ?? 0, [task]);
  const laborCost = useMemo(() => task ? (task.spentMinutes / 60) * task.hourlyCostRate : 0, [task]);
  const workBillingNet = useMemo(() => task?.billable ? task.quantity * task.unitPrice * (1 - task.discountPercent / 100) : 0, [task]);
  const billingNet = workBillingNet + billableExtraCostTotal;
  const billingVat = task ? billingNet * task.vatRate / 100 : 0;
  const hasInvoiceContent = Boolean(task && (task.billable || billableExtraCostTotal > 0));
  const canCreateInvoice = Boolean(task?.clientId && hasInvoiceContent && !task.projectId);
  const processHistory = useMemo<ProcessHistoryEntry[]>(() => {
    if (!task) return [];
    return [
      ...task.timeEntries.map((entry) => ({ kind: "TIME" as const, id: entry.id, description: entry.note || "Pa përshkrim", createdAt: entry.createdAt, workDate: entry.workDate, startTime: entry.startTime, endTime: entry.endTime, minutes: entry.minutes })),
      ...task.noteEntries.map((entry) => ({ kind: "NOTE" as const, id: entry.id, description: entry.note, createdAt: entry.createdAt })),
    ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }, [task]);
  if (loading) return <div className="taskDetailState">Duke ngarkuar detyrën...</div>;
  if (!task) return <div className="taskDetailState errorState"><strong>Detyra nuk u hap</strong><span>{error}</span><Link href="/tasks">Kthehu te detyrat</Link></div>;

  return <>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}
    <section className="taskDetailOverview">
      <div className="taskDetailHero">
        <div><div className="taskHeaderMeta"><Link className="taskBackButton" href="/tasks" aria-label="Kthehu te detyrat" title="Kthehu te detyrat">←</Link><div className="taskDetailBadges"><span className={`taskPriority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span><span className={`taskStatusBadge ${task.status.toLowerCase()}`}>{statusLabels[task.status]}</span>{task.labels.map((label) => <span key={label.id} className="taskLabel"><i style={{ backgroundColor: label.color }} />{label.name}</span>)}</div></div><h2>{task.title}</h2><p>{task.description || "Pa përshkrim."}</p></div>
        <div className="taskDetailActions"><Link className="secondaryButton taskDetailEditButton" href={`/tasks?edit=${task.id}`}>✎ Edito detyrën</Link>{task.status !== "COMPLETED" ? <button className="primaryButton" onClick={() => setShowCompletion(true)}>✓ Përfundo detyrën</button> : !["DRAFTED", "INVOICED"].includes(task.billingStatus) ? <button className="secondaryButton" onClick={() => void reopen()}>Rihap detyrën</button> : null}{task.invoiceId && <Link className="secondaryButton" href={`/invoices#invoice-${task.invoiceId}`}>{task.invoiceNumber || "Hap faturën"}</Link>}</div>
      </div>
      <div className="taskDetailMetrics"><article><small>{task.subjectType === "CLIENT" ? "Klienti" : "Personi"}</small><strong>{task.subjectName}</strong></article><article><small>Projekti / Faza</small><strong>{task.projectName || "Pa projekt"}</strong>{task.projectMilestoneName && <span>{task.projectMilestoneName}</span>}</article><article><small>Periudha</small><strong>{task.startDate || "—"} → {task.dueDate || "—"}</strong></article><article><small>Koha e punuar</small><strong>{formatHours(task.spentMinutes)}</strong><span>Planifikuar: {formatHours(task.estimatedMinutes)}</span></article></div>
    </section>
    <div className="taskDetailLayout">
      <main className="taskDetailMain">
        <section className="taskDetailCard taskPlanningCard">
          <div className="taskPlanningGrid workProcessOnly">
            <section className="taskPlanningSection activityPlanningSection">
              <header className="workProcessTitle"><h3>Procesi i punës</h3><strong>{formatHours(task.spentMinutes)}</strong></header>
              <div className="workProcessPanel">
                <form className="workProcessForm" onSubmit={addTime}>
                  <div className="workProcessTimeRow"><label className="workProcessDate"><span>Data</span><input required type="date" value={timeForm.workDate} onChange={(event) => setTimeForm({ ...timeForm, workDate: event.target.value })} /></label><label><span>Prej</span><input required type="time" value={timeForm.startTime} onChange={(event) => setTimeForm({ ...timeForm, startTime: event.target.value })} /></label><label><span>Deri</span><input required type="time" value={timeForm.endTime} onChange={(event) => setTimeForm({ ...timeForm, endTime: event.target.value })} /></label></div>
                  <div className="workProcessDescriptionRow"><label className="workProcessDescription"><span>Përshkrimi i punës</span><input required minLength={2} value={timeForm.note} onChange={(event) => setTimeForm({ ...timeForm, note: event.target.value })} placeholder="P.sh. Sot u përgatit logoja" /></label><button className="primaryButton" disabled={saving}>Ruaj procesin</button></div>
                </form>
                <div className="workProcessTimeline">
                  {processHistory.map((entry) => <article key={`${entry.kind}-${entry.id}`}>
                    <i />
                    <div className="processHistoryContent">
                      <div className="processHistoryHeader">
                        <div className="processHistoryMeta">{entry.kind === "TIME" ? <><time>{formatWorkDate(entry.workDate)}</time><span>{entry.startTime && entry.endTime ? `${entry.startTime}–${entry.endTime}` : "Manualisht"}</span><span>◷ {formatHours(entry.minutes)}</span></> : <><time>{formatDateTime(entry.createdAt)}</time><span>Shënim i mëparshëm</span></>}</div>
                        {entry.kind === "TIME" && <button className="processHistoryDelete" type="button" disabled={saving} onClick={() => void removeTimeEntry(entry.id)} aria-label="Fshi regjistrimin e procesit">×</button>}
                      </div>
                      <p>{entry.description}</p>
                    </div>
                  </article>)}
                  {!processHistory.length && <p className="emptyInline">Nuk ka proces pune të regjistruar.</p>}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <aside className="taskDetailSidebar">
        <section className="taskDetailCard workCostSummary">
          <header><div><h3>Orët e punës</h3><p>Përmbledhja llogaritet automatikisht nga regjistrimet.</p></div></header>
          <div className="workCostMetrics"><article><small>Gjithsej</small><strong>{formatHours(task.spentMinutes)}</strong></article><article><small>Për faturim</small><strong>{formatHours(task.billable ? task.spentMinutes : 0)}</strong></article><article><small>Kosto e punës</small><strong>{euro(laborCost)}</strong></article></div>
          <p className="costRateHint">Tarifa e kostos: <strong>{euro(task.hourlyCostRate)}/orë</strong></p>
        </section>
        <section className="taskDetailCard extraCostCard">
          <header className="extraCostHeader"><h3>Kosto shtesë</h3><div className="extraCostActions"><button type="button" className={`extraCostViewButton ${showCostList ? "active" : ""}`} onClick={() => setShowCostList((value) => !value)}>{showCostList ? "Mbyll kostot" : "Shiko kostot"}</button><button type="button" className="smallPrimaryButton" onClick={() => setShowCostForm((value) => !value)}>{showCostForm ? "Anulo" : "+ Shto"}</button></div></header>
          {showCostForm && <form className="extraCostForm" onSubmit={addExtraCost}>
            <div className="extraCostType"><button type="button" className={costForm.costType === "INTERNAL" ? "active" : ""} onClick={() => setCostForm({ ...costForm, costType: "INTERNAL", billableAmount: "" })}>Kosto e brendshme</button><button type="button" disabled={!task.clientId} className={costForm.costType === "CLIENT" ? "active" : ""} onClick={() => setCostForm({ ...costForm, costType: "CLIENT", billableAmount: costForm.billableAmount || costForm.amount })}>Për klientin</button></div>
            <p className="extraCostTypeHint">{costForm.costType === "INTERNAL" ? "Ruhet vetëm si shpenzim i brendshëm dhe nuk kalon në faturë." : "Shuma për faturim do të shtohet automatikisht si pozicion në faturën e klientit."}</p>
            <label><span>Përshkrimi</span><input required minLength={2} value={costForm.description} onChange={(event) => setCostForm({ ...costForm, description: event.target.value })} placeholder="P.sh. Licencë, material ose transport" /></label>
            <div className={`extraCostFields ${costForm.costType === "CLIENT" ? "withBilling" : ""}`}><label><span>Data</span><input required type="date" value={costForm.costDate} onChange={(event) => setCostForm({ ...costForm, costDate: event.target.value })} /></label><label><span>Kosto reale (€)</span><input required type="number" min="0.01" step="0.01" value={costForm.amount} onChange={(event) => setCostForm({ ...costForm, amount: event.target.value })} /></label>{costForm.costType === "CLIENT" && <label><span>Për faturim, pa TVSH (€)</span><input required type="number" min="0.01" step="0.01" value={costForm.billableAmount} onChange={(event) => setCostForm({ ...costForm, billableAmount: event.target.value })} /></label>}</div>
            <button className="primaryButton" disabled={saving}>Ruaj koston</button>
          </form>}
          {showCostList && <div className="extraCostList visibleCostList">{task.extraCosts.length ? task.extraCosts.map((cost) => <article key={cost.id}><div><strong>{cost.description}</strong><small>{cost.costDate} · <span className={`extraCostBadge ${cost.costType.toLowerCase()}`}>{cost.costType === "CLIENT" ? "Për klientin" : "E brendshme"}</span></small></div><div><strong>{euro(cost.amount)}</strong>{cost.costType === "CLIENT" && <small>Faturim: {euro(cost.billableAmount)}</small>}<button type="button" disabled={saving} onClick={() => void removeExtraCost(cost.id)} aria-label={`Fshi ${cost.description}`}>×</button></div></article>) : <p className="emptyInline">Nuk ka kosto shtesë.</p>}</div>}
          <div className="extraCostSummary"><span><small>Kosto të brendshme</small><strong>{euro(internalCostTotal)}</strong></span><span><small>Për klientin</small><strong>{euro(billableExtraCostTotal)}</strong></span></div>
          <footer><span>Kosto totale</span><strong>{euro(extraCostTotal)}</strong></footer>
        </section>
        <section className="taskDetailCard billingSummary billingCenter">
          <header><div><h3>Faturimi</h3><p>{task.projectId ? "Kjo detyrë faturohet përmes projektit." : hasInvoiceContent ? "Puna dhe shpenzimet që do të kalojnë në faturë." : "Kjo detyrë nuk ka pozicione për faturim."}</p></div><strong>{task.projectId ? task.projectBillingType === "INCLUDED" ? "Në paketë" : task.projectBillingType === "EXTRA_BILLABLE" ? "Shtesë" : "Pa pagesë" : hasInvoiceContent ? euro(billingNet + billingVat) : "Pa faturim"}</strong></header>
          {task.projectId ? <div className="projectBillingNotice"><p>Çmimi bazë, puna shtesë dhe kostot për klientin përmblidhen në faqen e projektit.</p><Link className="primaryButton" href={`/projects/${task.projectId}`}>Hap projektin</Link></div> : hasInvoiceContent ? <>
            <div className="billingBreakdown"><article><small>Puna e kryer</small><strong>{task.billable ? euro(workBillingNet) : "Pa faturim"}</strong></article><article><small>Kosto për klientin</small><strong>{euro(billableExtraCostTotal)}</strong></article><article><small>Totali pa TVSH</small><strong>{euro(billingNet)}</strong></article></div>
            <div className="billingTaxLine"><span>TVSH {task.vatRate}%</span><strong>{euro(billingVat)}</strong></div>
            {internalCostTotal > 0 && <p className="billingExcludedCost">Kosto të brendshme: <strong>{euro(internalCostTotal)}</strong> · nuk kalojnë në faturë.</p>}
            <div className="billingDecision"><span className={`billingBadge ${task.billingStatus.toLowerCase()}`}>{task.billingStatus === "PENDING" ? "Pret faturim" : task.billingStatus === "NOT_READY" ? "Gati pas përfundimit" : task.billingStatus === "DRAFTED" ? "Në draft faturë" : task.billingStatus === "INVOICED" ? "E faturuar" : billableExtraCostTotal > 0 ? "Ka shpenzime për faturim" : "Pa faturim"}</span><div className="billingDecisionActions">{task.status !== "COMPLETED" ? <span className="billingCompletionHint">Përfundo detyrën për të krijuar faturën.</span> : ["DRAFTED", "INVOICED"].includes(task.billingStatus) && task.invoiceId ? <Link href={`/invoices#invoice-${task.invoiceId}`} className="primaryButton">Hap faturën</Link> : canCreateInvoice ? <><button type="button" className="primaryButton" disabled={saving} onClick={() => void createDraftInvoice()}>Krijo draft faturë</button>{task.billingStatus !== "PENDING" && <button type="button" className="secondaryButton" disabled={saving} onClick={() => void queueBilling()}>Faturo më vonë</button>}</> : null}</div></div>
          </> : <div className="billingEmptyState"><span className={`billingBadge ${task.billingStatus.toLowerCase()}`}>Pa faturim</span><p>Mund ta përfundosh detyrën pa krijuar faturë.</p></div>}
        </section>
      </aside>
    </div>
    {showCompletion && <div className="modalBackdrop" onMouseDown={() => !saving && setShowCompletion(false)}><div className="completionModal" onMouseDown={(event) => event.stopPropagation()}><div className="confirmIcon complete">✓</div><h2>Përfundo detyrën?</h2><strong>{task.title}</strong><p>{task.projectId ? "Faturimi do të menaxhohet nga projekti." : "Zgjidh çfarë duhet të ndodhë pas mbylljes."}</p><div className="completionActions">{task.projectId ? <button className="primaryButton" disabled={saving} onClick={() => void finish("PROJECT")}>Përfundo detyrën</button> : <>{canCreateInvoice && <><button className="primaryButton" disabled={saving} onClick={() => void finish("NOW")}>Përfundo dhe kalo për faturim</button><button className="secondaryButton" disabled={saving} onClick={() => void finish("LATER")}>Përfundo, faturo më vonë</button></>}<button className="secondaryButton" disabled={saving} onClick={() => void finish("NO")}>Përfundo pa faturuar punën</button></>}<button className="textButton" onClick={() => setShowCompletion(false)}>Anulo</button></div></div></div>}
  </>;
}
