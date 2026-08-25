"use client";
import { FormEvent, useEffect, useState } from "react";

type Role = "GLOBAL_ADMIN" | "WORKER" | "CLIENT";
interface User { id: number; email: string; displayName: string; status: "ACTIVE" | "INACTIVE" | "LOCKED"; role: Role; clientId: number | null; clientName: string | null; createdAt: string; }
interface Client { id: number; name: string; }
const roles: Record<Role, string> = { GLOBAL_ADMIN: "Global Admin", WORKER: "Punëtor", CLIENT: "Klient" };
const emptyForm = { displayName: "", email: "", password: "", role: "WORKER" as Role, clientId: "" };

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]); const [clients, setClients] = useState<Client[]>([]); const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function load() {
    const [usersResponse, clientsResponse] = await Promise.all([fetch("/api/v1/admin/users", { cache: "no-store" }), fetch("/api/v1/clients?view=active", { cache: "no-store" })]);
    const [usersResult, clientsResult] = await Promise.all([usersResponse.json(), clientsResponse.json()]);
    if (usersResult.ok) setUsers(usersResult.data); else setError(usersResult.error?.message || "Gabim.");
    if (clientsResult.ok) setClients(clientsResult.data);
  }
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { const response = await fetch("/api/v1/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, clientId: form.role === "CLIENT" ? Number(form.clientId) : null }) }); const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.error?.message || "Gabim."); setOpen(false); setForm(emptyForm); setMessage("Përdoruesi u krijua."); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim."); } finally { setSaving(false); }
  }
  async function patch(user: User, payload: Record<string, unknown>) {
    setSaving(true); setError(""); const response = await fetch(`/api/v1/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); setSaving(false); if (!response.ok || !result.ok) { setError(result.error?.message || "Gabim."); return; } setMessage("Përdoruesi u përditësua."); await load();
  }
  async function resetPassword(user: User) { const password = window.prompt(`Password-i i ri për ${user.email} (minimum 10 karaktere):`); if (password) await patch(user, { password }); }
  async function removeUser(user: User) { if (!window.confirm(`Fshi përdoruesin ${user.displayName} (${user.email})?`)) return; setSaving(true); setError(""); setMessage(""); try { const response = await fetch(`/api/v1/admin/users/${user.id}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.error?.message || "Përdoruesi nuk mund të fshihet."); setMessage("Përdoruesi u fshi."); await load(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim."); } finally { setSaving(false); } }
  return <>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}
    <section className="userWorkspace"><header><div><h2>Përdoruesit & Rolet</h2><p>Menaxho qasjen në SIRA dhe portalin e klientit.</p></div><button className="primaryButton" onClick={() => setOpen(true)}>+ Përdorues</button></header>
      <div className="userRoleCards"><article><strong>Global Admin</strong><span>Qasje e plotë</span></article><article><strong>Punëtor</strong><span>Projektet dhe detyrat</span></article><article><strong>Klient</strong><span>Vetëm portali i vet</span></article></div>
      <div className="userTableWrap"><table className="userTable"><thead><tr><th>Përdoruesi</th><th>Roli</th><th>Klienti</th><th>Statusi</th><th>Veprimet</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.displayName}</strong><small>{user.email}</small></td><td><select value={user.role} disabled={saving} onChange={(event) => void patch(user, { role: event.target.value, clientId: event.target.value === "CLIENT" ? user.clientId : null })}>{Object.entries(roles).filter(([value]) => value !== "CLIENT" || user.role === "CLIENT").map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></td><td>{user.clientName || "—"}</td><td><span className={`userStatus ${user.status.toLowerCase()}`}>{user.status === "ACTIVE" ? "Aktiv" : "Jo aktiv"}</span></td><td><button onClick={() => void resetPassword(user)}>Password</button><button onClick={() => void patch(user, { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{user.status === "ACTIVE" ? "Çaktivizo" : "Aktivizo"}</button><button className="userDeleteButton" disabled={saving} onClick={() => void removeUser(user)}>Fshi</button></td></tr>)}</tbody></table></div>
    </section>
    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className="clientModal userModal" onMouseDown={(event) => event.stopPropagation()}><div className="modalHeader"><div><span>PËRDORUES I RI</span><h2>Krijo qasje</h2></div><button className="modalClose" onClick={() => setOpen(false)}>×</button></div><form className="userForm" onSubmit={submit}><label><span>Emri *</span><input required minLength={2} value={form.displayName} onChange={(e) => setForm({...form,displayName:e.target.value})}/></label><label><span>Email *</span><input required type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})}/></label><label><span>Password *</span><input required type="password" minLength={10} value={form.password} onChange={(e) => setForm({...form,password:e.target.value})}/></label><label><span>Roli</span><select value={form.role} onChange={(e) => setForm({...form,role:e.target.value as Role,clientId:""})}>{Object.entries(roles).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{form.role === "CLIENT" && <label className="fieldWide"><span>Lidhe me klientin *</span><select required value={form.clientId} onChange={(e)=>setForm({...form,clientId:e.target.value})}><option value="">Zgjidh klientin</option>{clients.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}<div className="modalActions fieldWide"><button type="button" className="secondaryButton" onClick={()=>setOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>Krijo</button></div></form></div></div>}
  </>;
}
