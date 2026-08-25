"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

interface Client { id: number; name: string; }
interface PendingTask {
  id: number;
  clientId: number | null;
  clientName: string | null;
  projectName: string | null;
  title: string;
  billable: boolean;
  invoiceDescription: string | null;
  billingType: "FIXED" | "HOURLY";
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
  billingTotal: number;
  billableExtraCostTotal: number;
  completedAt: string | null;
}
interface Invoice {
  id: number;
  clientId: number;
  clientName: string;
  invoiceNumber: string;
  status: "DRAFT" | "FINALIZED" | "CANCELLED";
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  itemCount: number;
}
interface DraftLine {
  taskId: number;
  billable: boolean;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
  billableExtraCostTotal: number;
}

const statusLabels = { DRAFT: "Draft", FINALIZED: "Finalizuar", CANCELLED: "Anuluar" } as const;

function today() { return new Date().toISOString().slice(0, 10); }
function plusDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}
function euro(value: number) {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value);
}
function lineTotal(line: DraftLine) {
  const gross = line.billable ? line.quantity * line.unitPrice : 0;
  const net = gross * (1 - line.discountPercent / 100);
  return (net + line.billableExtraCostTotal) * (1 + line.vatRate / 100);
}

export function InvoiceManager() {
  const initialDate = today();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(initialDate);
  const [dueDate, setDueDate] = useState(plusDays(initialDate, 14));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadWorkspace(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const response = await fetch("/api/v1/invoices", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Faturat nuk mund të ngarkohen.");
      setInvoices(result.data.invoices); setPendingTasks(result.data.pendingTasks);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setLoading(false); }
  }

  async function loadClients() {
    try {
      const response = await fetch("/api/v1/clients?view=active", { cache: "no-store" });
      const result = await response.json();
      if (response.ok && result.ok) setClients(result.data);
    } catch { /* The invoice workspace displays the API error if needed. */ }
  }

  useEffect(() => { void Promise.all([loadWorkspace(true), loadClients()]); }, []);

  function openComposer() {
    const date = today();
    setClientId(""); setIssueDate(date); setDueDate(plusDays(date, 14));
    setNotes(""); setLines([]); setError(""); setOpen(true);
  }

  function toggleTask(task: PendingTask) {
    setLines((current) => current.some((line) => line.taskId === task.id)
      ? current.filter((line) => line.taskId !== task.id)
      : [...current, {
          taskId: task.id,
          billable: task.billable,
          description: task.invoiceDescription || task.title,
          quantity: task.billable ? task.quantity : 1,
          unitPrice: task.billable ? task.unitPrice : 0,
          vatRate: task.vatRate,
          discountPercent: task.discountPercent,
          billableExtraCostTotal: task.billableExtraCostTotal,
        }]);
  }

  function updateLine(taskId: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => line.taskId === taskId ? { ...line, ...patch } : line));
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: Number(clientId), issueDate, dueDate: dueDate || null, notes: notes || null, items: lines }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Drafti nuk mund të krijohet.");
      setOpen(false); setMessage(`Drafti ${result.data.invoiceNumber} u krijua me sukses.`);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  async function invoiceAction(invoice: Invoice, action: "finalize" | "cancel") {
    const question = action === "finalize"
      ? `Ta finalizojmë faturën ${invoice.invoiceNumber}? Punët do të shënohen si të faturuara.`
      : `Ta anulojmë faturën ${invoice.invoiceNumber}? Punët do të rikthehen te “Pret faturim”.`;
    if (!window.confirm(question)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(
        action === "finalize" ? `/api/v1/invoices/${invoice.id}/finalize` : `/api/v1/invoices/${invoice.id}`,
        { method: action === "finalize" ? "POST" : "DELETE" },
      );
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Veprimi nuk mund të përfundohet.");
      setMessage(action === "finalize" ? "Fatura u finalizua dhe punët u shënuan si të faturuara." : "Fatura u anulua dhe punët u rikthyen për faturim.");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  const clientTasks = useMemo(() => pendingTasks.filter((task) => String(task.clientId) === clientId), [pendingTasks, clientId]);
  const selectedTotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const stats = useMemo(() => ({
    drafts: invoices.filter((invoice) => invoice.status === "DRAFT").length,
    finalized: invoices.filter((invoice) => invoice.status === "FINALIZED").length,
    pending: pendingTasks.length,
    total: invoices.filter((invoice) => invoice.status === "FINALIZED").reduce((sum, invoice) => sum + invoice.total, 0),
  }), [invoices, pendingTasks]);

  return <>
    <section className="invoiceStats">
      <article><small>Punë për faturim</small><strong>{stats.pending}</strong><span>Të përfunduara dhe të gatshme</span></article>
      <article><small>Draft fatura</small><strong>{stats.drafts}</strong><span>Në përgatitje</span></article>
      <article><small>Fatura të finalizuara</small><strong>{stats.finalized}</strong><span>Të mbyllura</span></article>
      <article><small>Totali i faturuar</small><strong>{euro(stats.total)}</strong><span>Fatura të finalizuara</span></article>
    </section>

    {message && <div className="clientAlert success">{message}</div>}
    {error && <div className="clientAlert error">{error}</div>}

    <section className="invoiceWorkspace">
      <div className="invoiceToolbar"><div><h2>Faturat</h2><p>Zgjidh punët e përfunduara dhe shtoji si pozicione të faturës.</p></div><button className="primaryButton" onClick={openComposer}>+ Faturë e re</button></div>
      {loading ? <div className="taskLoading">Duke ngarkuar faturat...</div> : <div className="invoiceTableWrap"><table className="invoiceTable"><thead><tr><th>Numri</th><th>Klienti</th><th>Data / Afati</th><th>Pozicione</th><th>Statusi</th><th>Totali</th><th /></tr></thead><tbody>{invoices.length ? invoices.map((invoice) => <tr id={`invoice-${invoice.id}`} key={invoice.id} className={invoice.status === "CANCELLED" ? "cancelledInvoice" : ""}>
        <td><strong>{invoice.invoiceNumber}</strong><small>#{invoice.id}</small></td><td>{invoice.clientName}</td><td>{invoice.issueDate}<small>{invoice.dueDate ? `Afati: ${invoice.dueDate}` : "Pa afat"}</small></td><td>{invoice.itemCount}</td><td><span className={`invoiceStatus ${invoice.status.toLowerCase()}`}>{statusLabels[invoice.status]}</span></td><td><strong>{euro(invoice.total)}</strong><small>TVSH {euro(invoice.taxTotal)}</small></td><td><div className="invoiceActions">{invoice.status === "DRAFT" && <button className="finalizeInvoice" disabled={saving} onClick={() => void invoiceAction(invoice, "finalize")}>Finalizo</button>}{invoice.status !== "CANCELLED" && <button className="cancelInvoice" disabled={saving} onClick={() => void invoiceAction(invoice, "cancel")}>Anulo</button>}</div></td>
      </tr>) : <tr><td colSpan={7} className="tableState"><div className="emptyClientIcon">€</div><strong>Nuk ka fatura ende</strong><span>Përfundo një detyrë dhe vendose për faturim.</span></td></tr>}</tbody></table></div>}
    </section>

    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className="invoiceModal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modalHeader"><div><span>FATURË E RE</span><h2>Punët për faturim</h2><p>Zgjidh klientin dhe punët që do të kalojnë në draft.</p></div><button className="modalClose" onClick={() => setOpen(false)}>×</button></div>
      <form onSubmit={createDraft} className="invoiceForm">
        <div className="invoiceHeaderFields">
          <label><span>Klienti *</span><select required value={clientId} onChange={(event) => { setClientId(event.target.value); setLines([]); }}><option value="">Zgjidh klientin</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><span>Data e faturës</span><input type="date" required value={issueDate} onChange={(event) => { setIssueDate(event.target.value); if (event.target.value) setDueDate(plusDays(event.target.value, 14)); }} /></label>
          <label><span>Afati i pagesës</span><input type="date" value={dueDate} min={issueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        </div>

        <div className="billingTaskPicker">
          <div className="billingPickerHeader"><div><h3>Punët e përfunduara</h3><p>Vetëm punët me status “Pret faturim” shfaqen këtu.</p></div><strong>{lines.length} të zgjedhura</strong></div>
          {!clientId ? <div className="billingPickerEmpty">Zgjidh klientin për të parë punët.</div> : clientTasks.length === 0 ? <div className="billingPickerEmpty">Ky klient nuk ka punë në pritje për faturim.</div> : <div className="billingTaskList">{clientTasks.map((task) => {
            const selected = lines.some((line) => line.taskId === task.id);
            return <label key={task.id} className={selected ? "selected" : ""}><input type="checkbox" checked={selected} onChange={() => toggleTask(task)} /><div><strong>{task.title}</strong><span>{task.projectName || "Pa projekt"} · {task.completedAt?.slice(0, 10) || "Përfunduar"}</span></div><b>{euro(task.billingTotal)}</b></label>;
          })}</div>}
        </div>

        {lines.length > 0 && <div className="invoiceLineEditor"><div className="invoiceLineHeader"><span>Përshkrimi</span><span>Sasia</span><span>Çmimi</span><span>TVSH</span><span>Zbritja</span><span>Totali</span></div>{lines.map((line) => <div className="invoiceLine" key={line.taskId}>
          <div className="invoiceLineDescription"><input value={line.description} onChange={(event) => updateLine(line.taskId, { description: event.target.value })} />{line.billableExtraCostTotal > 0 && <small>{line.billable ? "+ " : ""}{euro(line.billableExtraCostTotal)} kosto shtesë pa TVSH{!line.billable ? " · vetëm shpenzimet faturohen" : ""}</small>}</div>
          <input type="number" min="0.01" step="0.01" disabled={!line.billable} value={line.quantity} onChange={(event) => updateLine(line.taskId, { quantity: Number(event.target.value) })} />
          <input type="number" min="0" step="0.01" disabled={!line.billable} value={line.unitPrice} onChange={(event) => updateLine(line.taskId, { unitPrice: Number(event.target.value) })} />
          <input type="number" min="0" max="100" step="0.01" value={line.vatRate} onChange={(event) => updateLine(line.taskId, { vatRate: Number(event.target.value) })} />
          <input type="number" min="0" max="100" step="0.01" disabled={!line.billable} value={line.discountPercent} onChange={(event) => updateLine(line.taskId, { discountPercent: Number(event.target.value) })} />
          <strong>{euro(lineTotal(line))}</strong>
        </div>)}</div>}

        <label className="invoiceNotes"><span>Shënime në draft</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Kushtet ose shënime shtesë..." /></label>
        <div className="invoiceComposerFooter"><div><span>Totali i draftit</span><strong>{euro(selectedTotal)}</strong></div><div><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button type="submit" className="primaryButton" disabled={saving || !clientId || lines.length === 0}>{saving ? "Duke krijuar..." : "Krijo draftin"}</button></div></div>
      </form>
    </div></div>}
  </>;
}
