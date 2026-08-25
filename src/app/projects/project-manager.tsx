"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type ProjectStatus = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
interface Client { id: number; name: string; }
interface ProductPackage { id: number; name: string; description: string | null; basePrice: number; vatRate: number; templateTasks: string[]; }
interface ProjectLabel { id: number; name: string; color: string; }
interface Project {
  id: number; clientId: number | null; clientName: string | null; productId: number | null; productName: string | null;
  name: string; description: string | null; basePrice: number; vatRate: number; discountPercent: number;
  projectType: "WEBSITE" | "IT" | "GRAPHIC" | "VIDEO" | "MARKETING" | "OTHER";
  status: ProjectStatus; startDate: string | null; dueDate: string | null; billingStatus: string;
  taskCount: number; completedTaskCount: number; spentMinutes: number; estimatedMinutes: number;
  costBudget: number; profit: number; profitMargin: number; billingTotal: number; labels: ProjectLabel[];
}

const statuses: Array<{ value: ProjectStatus; label: string }> = [
  { value: "OPEN", label: "Në pritje" }, { value: "IN_PROGRESS", label: "Në punë" },
  { value: "ON_HOLD", label: "Në pritje" }, { value: "COMPLETED", label: "Përfunduar" },
  { value: "CANCELLED", label: "Anuluar" },
];
const projectTypeLabels = { WEBSITE: "Website", IT: "IT", GRAPHIC: "Grafikë", VIDEO: "Video", MARKETING: "Marketing", OTHER: "Tjetër" } as const;
const emptyForm = { clientId: "", productId: "", projectType: "WEBSITE" as keyof typeof projectTypeLabels, name: "", description: "", startDate: "", dueDate: "", estimatedHours: "", costBudget: "0", basePrice: "0", vatRate: "20", discountPercent: "0", createTemplateTasks: true };
function euro(value: number) { return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value); }
function formatDate(value: string | null) { if (!value) return "Pa afat"; const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; }

export function ProjectManager() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<ProductPackage[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/v1/projects", { cache: "no-store" }),
        fetch("/api/v1/clients?view=active", { cache: "no-store" }),
        fetch("/api/v1/products?active=1", { cache: "no-store" }),
      ]);
      const results = await Promise.all(responses.map((response) => response.json()));
      if (!responses[0].ok || !results[0].ok) throw new Error(results[0]?.error?.message || "Projektet nuk mund të ngarkohen.");
      setProjects(results[0].data);
      if (responses[1].ok && results[1].ok) setClients(results[1].data);
      if (responses[2].ok && results[2].ok) setProducts(results[2].data);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function suggestedName(clientId = form.clientId, productId = form.productId) {
    const client = clients.find((item) => String(item.id) === clientId);
    const product = products.find((item) => String(item.id) === productId);
    return product ? `${product.name}${client ? ` – ${client.name}` : ""}` : form.name;
  }
  function selectClient(clientId: string) {
    setForm((current) => ({ ...current, clientId, name: current.productId ? suggestedName(clientId, current.productId) : current.name }));
  }
  function selectProduct(productId: string) {
    const product = products.find((item) => String(item.id) === productId);
    setForm((current) => ({
      ...current, productId, name: product ? suggestedName(current.clientId, productId) : current.name,
      description: product?.description ?? current.description,
      basePrice: product ? String(product.basePrice) : current.basePrice,
      vatRate: product ? String(product.vatRate) : current.vatRate,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: Number(form.clientId), productId: form.productId ? Number(form.productId) : null,
          projectType: form.projectType,
          name: form.name, description: form.description || null, basePrice: Number(form.basePrice) || 0,
          vatRate: Number(form.vatRate) || 0, discountPercent: Number(form.discountPercent) || 0,
          status: "OPEN", startDate: form.startDate || null, dueDate: form.dueDate || null,
          estimatedMinutes: Math.max(0, Math.round((Number(form.estimatedHours) || 0) * 60)),
          costBudget: Number(form.costBudget) || 0,
          createTemplateTasks: form.createTemplateTasks,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Projekti nuk mund të ruhet.");
      setOpen(false); router.push(`/projects/${result.data.id}`);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${deleteTarget.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Projekti nuk mund të fshihet.");
      setProjects((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null); setOpenMenuId(null); setMessage("Projekti u fshi nga lista aktive.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  const filtered = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    return (!query || project.name.toLowerCase().includes(query) || project.clientName?.toLowerCase().includes(query))
      && (!clientFilter || String(project.clientId) === clientFilter)
      && (!productFilter || String(project.productId) === productFilter)
      && (!statusFilter
        || (statusFilter === "WAITING" && ["OPEN", "ON_HOLD"].includes(project.status))
        || (statusFilter === "WORKING" && project.status === "IN_PROGRESS")
        || (statusFilter === "DONE" && project.status === "COMPLETED"));
  });
  const activeCount = projects.filter((project) => ["OPEN", "IN_PROGRESS", "ON_HOLD"].includes(project.status)).length;
  const totalValue = projects.filter((project) => project.status !== "CANCELLED").reduce((sum, project) => sum + project.billingTotal, 0);

  return <>
    <section className="projectStats"><article><small>Projektet</small><strong>{projects.length}</strong><span>Gjithsej</span></article><article><small>Aktive</small><strong>{activeCount}</strong><span>Hapur, në punë ose në pritje</span></article><article><small>Vlera e projekteve</small><strong>{euro(totalValue)}</strong><span>Paketa dhe punë shtesë</span></article></section>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}
    <section className="projectWorkspace">
      <div className="projectToolbar"><div><h2>Lista e projekteve</h2><p>Hap projektin për të parë fazat dhe detyrat e tij.</p></div><div className="projectToolbarActions"><button className="primaryButton" onClick={() => { setForm(emptyForm); setShowMoreDetails(false); setOpen(true); }}>+ Projekt i ri</button></div></div>
      <div className="projectFilters"><label className="clientSearch"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kërko projekt..." /></label><select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="">Të gjithë klientët</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}><option value="">Të gjitha paketat</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Çdo status</option><option value="WAITING">Në pritje</option><option value="WORKING">Në punë</option><option value="DONE">Përfunduar</option></select></div>
      <div className="projectTableWrap"><table className="projectTable projectOverviewTable projectSimpleList"><thead><tr><th>Projekti</th><th>Klienti</th><th>Progresi</th><th>Afati</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="tableState">Duke ngarkuar...</td></tr> : filtered.length ? filtered.map((project) => { const progress = project.taskCount ? Math.round(project.completedTaskCount / project.taskCount * 100) : 0; return <tr key={project.id}><td className="projectNameCell"><Link href={`/projects/${project.id}`}>{project.name}</Link><small>{projectTypeLabels[project.projectType]} · {statuses.find((item) => item.value === project.status)?.label}</small></td><td>{project.clientName || "—"}</td><td><div className="projectProgress projectProgressCompact"><span><i style={{ width: `${progress}%` }} /></span><strong>{progress}%</strong></div></td><td>{formatDate(project.dueDate)}</td><td className="projectMenuCell"><button className="projectMenuButton" aria-label={`Veprimet për ${project.name}`} onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}>⋮</button>{openMenuId === project.id && <div className="projectRowMenu"><Link href={`/projects/${project.id}`}>Hap projektin</Link><Link href={`/projects/${project.id}#edit`}>Edito projektin</Link><Link href={`/projects/${project.id}#tasks`}>Hap detyrat</Link><button className="danger" onClick={() => setDeleteTarget(project)}>Fshi projektin</button></div>}</td></tr>; }) : <tr><td colSpan={5} className="tableState">Nuk ka projekte që përputhen me filtrat.</td></tr>}</tbody></table></div>
    </section>
    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}>
      <div className="clientModal projectCreateModal projectCreateModalSimple" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHeader"><div><span>PROJEKT I RI</span><h2>Krijo projekt</h2><p>Plotëso të dhënat kryesore; pjesën tjetër mund ta shtosh më vonë.</p></div><button type="button" className="modalClose" onClick={() => setOpen(false)}>×</button></div>
        <form className="projectCreateForm" onSubmit={submit}>
          <label><span>Klienti *</span><select required value={form.clientId} onChange={(event) => selectClient(event.target.value)}><option value="">Zgjidh klientin</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><span>Produkti / Paketa</span><select value={form.productId} onChange={(event) => selectProduct(event.target.value)}><option value="">Projekt i personalizuar</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label><span>Lloji i projektit *</span><select required value={form.projectType} onChange={(event) => setForm({ ...form, projectType: event.target.value as keyof typeof projectTypeLabels })}>{Object.entries(projectTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="fieldWide"><span>Emri i projektit *</span><input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="P.sh. Website për klientin" /></label>
          <label className="fieldWide"><span>Afati</span><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
          <button type="button" className="projectMoreDetailsButton fieldWide" onClick={() => setShowMoreDetails((value) => !value)}>{showMoreDetails ? "− Mbyll detajet shtesë" : "+ Më shumë detaje"}</button>
          {showMoreDetails && <div className="projectAdvancedCreateFields fieldWide">
            <label className="fieldWide"><span>Përshkrimi</span><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label><span>Data e fillimit</span><input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
            <label><span>Orë të planifikuara</span><input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} /></label>
            <label><span>Buxheti i kostos (€)</span><input type="number" min="0" step="0.01" value={form.costBudget} onChange={(event) => setForm({ ...form, costBudget: event.target.value })} /></label>
            <label><span>Çmimi bazë (€)</span><input type="number" min="0" step="0.01" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} /></label>
            <label><span>TVSH (%)</span><input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(event) => setForm({ ...form, vatRate: event.target.value })} /></label>
            <label><span>Zbritja (%)</span><input type="number" min="0" max="100" step="0.01" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} /></label>
            <label className="projectTemplateOption fieldWide"><input type="checkbox" checked={form.createTemplateTasks} onChange={(event) => setForm({ ...form, createTemplateTasks: event.target.checked })} /><span>Krijo automatikisht 4 fazat bazë, pa detyra</span></label>
          </div>}
          <div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : "Krijo projektin"}</button></div>
        </form>
      </div>
    </div>}
    {deleteTarget && <div className="modalBackdrop" onMouseDown={() => !saving && setDeleteTarget(null)}><div className="projectDeleteModal" onMouseDown={(event) => event.stopPropagation()}><div className="projectDeleteIcon">!</div><h2>Fshi projektin?</h2><strong>{deleteTarget.name}</strong><p>Projekti largohet nga lista aktive. Klienti dhe të dhënat historike nuk fshihen.</p><div><button className="secondaryButton" disabled={saving} onClick={() => setDeleteTarget(null)}>Anulo</button><button className="projectDangerButton" disabled={saving} onClick={() => void confirmDelete()}>{saving ? "Duke fshirë..." : "Fshi projektin"}</button></div></div></div>}
  </>;
}
