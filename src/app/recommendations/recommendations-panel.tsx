"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "PENDING" | "ACCEPTED" | "DECLINED";
interface Recommendation { id: number; clientId: number; clientName: string | null; projectId: number | null; projectName: string | null; title: string; description: string | null; status: Status; taskId: number | null; createdAt: string }
interface Client { id: number; name: string; companyName: string | null }
interface Project { id: number; name: string; clientId: number | null }

const statusLabel: Record<Status, string> = { PENDING: "Në pritje", ACCEPTED: "Pranuar", DECLINED: "Refuzuar" };
const emptyForm = { clientId: "", projectId: "", title: "", description: "" };

interface Props {
  embedded?: boolean;
  clientId?: number;
  clientName?: string | null;
  projectId?: number;
  projectName?: string | null;
}

export function RecommendationsPanel({ embedded = false, clientId, clientName, projectId, projectName }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ ...emptyForm, clientId: clientId ? String(clientId) : "", projectId: projectId ? String(projectId) : "" });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");

  async function load() {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (clientId) params.set("clientId", String(clientId));
      if (projectId) params.set("projectId", String(projectId));
      const requests: Promise<Response>[] = [fetch(`/api/v1/recommendations${params.toString() ? `?${params}` : ""}`, { cache: "no-store" })];
      if (!embedded) requests.push(fetch("/api/v1/clients", { cache: "no-store" }), fetch("/api/v1/projects", { cache: "no-store" }));
      const responses = await Promise.all(requests);
      const [recRes, clientRes, projectRes] = responses;
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson.ok) throw new Error(recJson?.error?.message || "Rekomandimet nuk mund të ngarkohen.");
      setRecommendations(recJson.data);
      if (clientRes) { const clientJson = await clientRes.json(); if (clientRes.ok && clientJson.ok) setClients(clientJson.data); }
      if (projectRes) { const projectJson = await projectRes.json(); if (projectRes.ok && projectJson.ok) setProjects(projectJson.data); }
    } catch (e) { setError(e instanceof Error ? e.message : "Gabim i panjohur."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [clientId, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => filter === "ALL" ? recommendations : recommendations.filter((r) => r.status === filter), [recommendations, filter]);
  const pendingCount = recommendations.filter((r) => r.status === "PENDING").length;
  const acceptedCount = recommendations.filter((r) => r.status === "ACCEPTED").length;
  const clientProjects = useMemo(() => projects.filter((p) => !form.clientId || p.clientId === Number(form.clientId)), [projects, form.clientId]);

  function create() {
    setEditingId(null);
    setForm({ clientId: clientId ? String(clientId) : "", projectId: projectId ? String(projectId) : "", title: "", description: "" });
    setOpen(true);
  }
  function edit(r: Recommendation) {
    setEditingId(r.id);
    setForm({ clientId: String(r.clientId), projectId: r.projectId ? String(r.projectId) : "", title: r.title, description: r.description ?? "" });
    setOpen(true);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const payload = { clientId: Number(form.clientId), projectId: form.projectId ? Number(form.projectId) : null, title: form.title, description: form.description || null };
      const r = await fetch(editingId ? `/api/v1/recommendations/${editingId}` : "/api/v1/recommendations", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error?.message || "Rekomandimi nuk mund të ruhet.");
      setOpen(false); setMessage(editingId ? "Rekomandimi u përditësua." : "Rekomandimi u shtua."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }
  async function remove(r: Recommendation) {
    if (!window.confirm(`A dëshiron ta fshish rekomandimin "${r.title}"?`)) return;
    setSaving(true); setError("");
    try {
      const r2 = await fetch(`/api/v1/recommendations/${r.id}`, { method: "DELETE" });
      const j = await r2.json();
      if (!r2.ok || !j.ok) throw new Error(j?.error?.message || "Rekomandimi nuk mund të fshihet.");
      setMessage("Rekomandimi u fshi."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }
  async function convert(r: Recommendation) {
    if (!window.confirm(`Klienti pranoi rekomandimin "${r.title}"? Do të krijohet një detyrë e re.`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/v1/recommendations/${r.id}/convert`, { method: "POST" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error?.message || "Rekomandimi nuk mund të kthehet në detyrë.");
      setMessage("Rekomandimi u pranua dhe u krijua detyra përkatëse."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }
  async function decline(r: Recommendation) {
    if (!window.confirm(`A e refuzoi klienti rekomandimin "${r.title}"?`)) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/v1/recommendations/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DECLINED" }) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error?.message || "Rekomandimi nuk mund të përditësohet.");
      setMessage("Rekomandimi u shënua si i refuzuar."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  return <>
    {!embedded && <div className="moduleTitleRow"><div><h2>Rekomandimet</h2><p>Regjistro rekomandime për klientët gjatë realizimit të projekteve; kur klienti pranon, bëhen detyrë automatikisht.</p></div><button className="primaryButton" onClick={create}>+ Rekomandim i ri</button></div>}
    {embedded && <div className="moduleTitleRow"><div><h3>Rekomandimet{projectName ? ` — ${projectName}` : clientName ? ` — ${clientName}` : ""}</h3><p>Ide dhe propozime për t&apos;i sugjeruar klientit në takimin e ardhshëm.</p></div><button className="primaryButton" onClick={create}>+ Rekomandim</button></div>}
    {!embedded && <section className="contractStats">
      <article><small>Gjithsej</small><strong>{recommendations.length}</strong></article>
      <article><small>Në pritje</small><strong>{pendingCount}</strong></article>
      <article><small>Pranuar</small><strong>{acceptedCount}</strong></article>
      <article><small>Refuzuar</small><strong>{recommendations.filter((r) => r.status === "DECLINED").length}</strong></article>
    </section>}
    {message && <div className="clientAlert success">{message}</div>}
    {error && <div className="clientAlert error">{error}</div>}
    <section className="contractPanel">
      <div className="contractToolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value as "ALL" | Status)}>
          <option value="ALL">Të gjitha statuset</option>
          <option value="PENDING">Në pritje</option>
          <option value="ACCEPTED">Pranuar</option>
          <option value="DECLINED">Refuzuar</option>
        </select>
      </div>
      {loading ? <div className="taskLoading">Duke ngarkuar rekomandimet...</div> : <div className="contractTableWrap"><table className="contractTable"><thead><tr>
        <th>REKOMANDIMI</th>
        {!embedded && <th>KLIENTI</th>}
        {!embedded && <th>PROJEKTI</th>}
        <th>STATUSI</th>
        <th>VEPRIMET</th>
      </tr></thead><tbody>{filtered.map((r) => <tr key={r.id}>
        <td><strong>{r.title}</strong>{r.description && <small>{r.description}</small>}</td>
        {!embedded && <td>{r.clientName || "—"}</td>}
        {!embedded && <td>{r.projectName || "—"}</td>}
        <td><span className={`statusPill ${r.status === "ACCEPTED" ? "active" : "inactive"}`}>{statusLabel[r.status]}</span></td>
        <td><div className="textActions">
          {r.status === "PENDING" && <button onClick={() => void convert(r)} disabled={saving}>Pranoi → Detyrë</button>}
          {r.status === "PENDING" && <button className="danger" onClick={() => void decline(r)} disabled={saving}>Refuzoi</button>}
          {r.status === "PENDING" && <button onClick={() => edit(r)}>Edito</button>}
          <button className="danger" disabled={saving} onClick={() => void remove(r)}>Fshije</button>
        </div></td>
      </tr>)}</tbody></table>{!filtered.length && <div className="catalogEmpty">Nuk ka rekomandime {filter !== "ALL" ? "me këtë status" : "të regjistruara ende"}.</div>}</div>}
    </section>
    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className="clientModal contractModal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="modalHeader"><div><h2>{editingId ? "Edito rekomandimin" : "Rekomandim i ri"}</h2><p>Regjistro idenë tani; pyete klientin në takimin e ardhshëm.</p></div><button type="button" className="modalClose" onClick={() => setOpen(false)}>×</button></div>
      <form className="contractForm" onSubmit={submit}>
        {!clientId ? <label><span>Klienti *</span><select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}><option value="">Zgjidh klientin</option>{clients.map((c) => <option value={c.id} key={c.id}>{c.companyName || c.name}</option>)}</select></label> : <input type="hidden" value={form.clientId} />}
        {!projectId ? <label><span>Projekti</span><select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">Pa projekt specifik</option>{clientProjects.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label> : <input type="hidden" value={form.projectId} />}
        <label className="fieldWide"><span>Titulli *</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="p.sh. Migrim në hosting më të shpejtë" /></label>
        <label className="fieldWide"><span>Përshkrimi</span><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pse e rekomandon këtë, çfarë përfitimi sjell për klientin..." /></label>
        <div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : editingId ? "Ruaj ndryshimet" : "Ruaj rekomandimin"}</button></div>
      </form>
    </div></div>}
  </>;
}
