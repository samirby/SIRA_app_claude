"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type AccessCategory = "SERVER" | "HOSTING" | "DOMAIN" | "NETWORK" | "CLOUD" | "DATABASE" | "EMAIL" | "APPLICATION" | "SOCIAL" | "OTHER";
type AccessScope = "PERSONAL" | "SIRA" | "CLIENT";
type AccessStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type TwoFactorStatus = "ENABLED" | "DISABLED" | "UNKNOWN";
type VaultProvider = "BITWARDEN" | "VAULTWARDEN" | "ONEPASSWORD" | "KEEPASS" | "OTHER";

interface Client { id: number; name: string; }
interface AccessEntry {
  id: number; clientId: number | null; clientName: string | null; name: string;
  category: AccessCategory; scope: AccessScope; provider: string | null; address: string | null;
  serviceUrl: string | null; username: string | null; vaultProvider: VaultProvider | null;
  vaultUrl: string | null; vaultReference: string | null; twoFactorStatus: TwoFactorStatus;
  renewalDate: string | null; notes: string | null; status: AccessStatus;
}

interface AccessForm {
  name: string; category: AccessCategory; scope: AccessScope; clientId: string; provider: string;
  address: string; serviceUrl: string; username: string; vaultProvider: "" | VaultProvider;
  vaultUrl: string; vaultReference: string; twoFactorStatus: TwoFactorStatus;
  renewalDate: string; notes: string; status: AccessStatus;
}

const categoryLabels: Record<AccessCategory, string> = {
  SERVER: "Server", HOSTING: "Hosting", DOMAIN: "Domain", NETWORK: "Rrjet", CLOUD: "Cloud",
  DATABASE: "Databazë", EMAIL: "E-mail", APPLICATION: "Aplikacion", SOCIAL: "Rrjete sociale", OTHER: "Tjetër",
};
const categoryIcons: Record<AccessCategory, string> = {
  SERVER: "▦", HOSTING: "H", DOMAIN: "◎", NETWORK: "⌁", CLOUD: "☁",
  DATABASE: "◉", EMAIL: "@", APPLICATION: "A", SOCIAL: "#", OTHER: "•",
};
const scopeLabels: Record<AccessScope, string> = { PERSONAL: "Personale", SIRA: "SIRA", CLIENT: "Klient" };
const statusLabels: Record<AccessStatus, string> = { ACTIVE: "Aktive", INACTIVE: "Jo aktive", ARCHIVED: "Arkivuar" };
const twoFactorLabels: Record<TwoFactorStatus, string> = { ENABLED: "2FA aktive", DISABLED: "Pa 2FA", UNKNOWN: "E pakonfirmuar" };
const vaultLabels: Record<VaultProvider, string> = { BITWARDEN: "Bitwarden", VAULTWARDEN: "Vaultwarden", ONEPASSWORD: "1Password", KEEPASS: "KeePass", OTHER: "Tjetër" };

const emptyForm: AccessForm = {
  name: "", category: "SERVER", scope: "SIRA", clientId: "", provider: "", address: "",
  serviceUrl: "", username: "", vaultProvider: "", vaultUrl: "", vaultReference: "",
  twoFactorStatus: "UNKNOWN", renewalDate: "", notes: "", status: "ACTIVE",
};

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

function formatDate(value: string | null) {
  if (!value) return "Pa afat";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function daysUntil(value: string | null) {
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function renewalText(value: string | null) {
  const days = daysUntil(value);
  if (days === null) return "Pa afat";
  if (days < 0) return `Skaduar para ${Math.abs(days)} ditësh`;
  if (days === 0) return "Skadon sot";
  if (days <= 30) return `Edhe ${days} ditë`;
  return formatDate(value);
}

function toForm(entry: AccessEntry): AccessForm {
  return {
    name: entry.name, category: entry.category, scope: entry.scope,
    clientId: entry.clientId ? String(entry.clientId) : "", provider: entry.provider ?? "",
    address: entry.address ?? "", serviceUrl: entry.serviceUrl ?? "", username: entry.username ?? "",
    vaultProvider: entry.vaultProvider ?? "", vaultUrl: entry.vaultUrl ?? "",
    vaultReference: entry.vaultReference ?? "", twoFactorStatus: entry.twoFactorStatus,
    renewalDate: entry.renewalDate ?? "", notes: entry.notes ?? "", status: entry.status,
  };
}

export function AccessRegistryManager() {
  const [entries, setEntries] = useState<AccessEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<AccessForm>(emptyForm);
  const [editing, setEditing] = useState<AccessEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (categoryFilter) params.set("category", categoryFilter);
    if (scopeFilter) params.set("scope", scopeFilter);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const response = await fetch(`/api/v1/accesses?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Qasjet nuk mund të ngarkohen.");
      setEntries(result.data);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setLoading(false); }
  }, [search, categoryFilter, scopeFilter, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    void fetch("/api/v1/clients?view=active", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => { if (result.ok) setClients(result.data); })
      .catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(""); setOpen(true);
  }

  function openEdit(entry: AccessEntry) {
    setEditing(entry); setForm(toForm(entry)); setError(""); setOpen(true);
  }

  function payload() {
    return {
      name: form.name, category: form.category, scope: form.scope,
      clientId: form.scope === "CLIENT" && form.clientId ? Number(form.clientId) : null,
      provider: form.provider || null, address: form.address || null,
      serviceUrl: form.serviceUrl || null, username: form.username || null,
      vaultProvider: form.vaultProvider || null, vaultUrl: form.vaultUrl || null,
      vaultReference: form.vaultReference || null, twoFactorStatus: form.twoFactorStatus,
      renewalDate: form.renewalDate || null, notes: form.notes || null, status: form.status,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(editing ? `/api/v1/accesses/${editing.id}` : "/api/v1/accesses", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Qasja nuk mund të ruhet.");
      setOpen(false); setMessage(editing ? "Qasja u përditësua." : "Qasja u regjistrua me sukses.");
      await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function changeStatus(entry: AccessEntry, status: AccessStatus) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/accesses/${entry.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Statusi nuk mund të ndryshohet.");
      setMessage(status === "ARCHIVED" ? "Qasja u arkivua." : "Qasja u aktivizua.");
      await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function copyUsername(entry: AccessEntry) {
    if (!entry.username) return;
    try { await navigator.clipboard.writeText(entry.username); setMessage("Username u kopjua."); }
    catch { setError("Username nuk mund të kopjohet automatikisht."); }
  }

  const stats = useMemo(() => ({
    active: entries.filter((entry) => entry.status === "ACTIVE").length,
    renewals: entries.filter((entry) => { const days = daysUntil(entry.renewalDate); return days !== null && days >= 0 && days <= 30; }).length,
    missingTwoFactor: entries.filter((entry) => entry.status === "ACTIVE" && entry.twoFactorStatus === "DISABLED").length,
    inVault: entries.filter((entry) => Boolean(entry.vaultUrl)).length,
  }), [entries]);

  return <>
    <section className="accessStats">
      <article><small>Qasje aktive</small><strong>{stats.active}</strong><span>Serverë dhe shërbime</span></article>
      <article><small>Rinovime 30 ditë</small><strong className={stats.renewals ? "warningText" : ""}>{stats.renewals}</strong><span>Domain ose hosting</span></article>
      <article><small>Pa 2FA</small><strong className={stats.missingTwoFactor ? "dangerText" : ""}>{stats.missingTwoFactor}</strong><span>Kërkojnë kontroll sigurie</span></article>
      <article><small>Në kasafortë</small><strong>{stats.inVault}</strong><span>Lidhje me vault</span></article>
    </section>

    <div className="accessSecurityNotice"><span>◈</span><div><strong>SIRA nuk ruan password-a</strong><p>Password-at dhe recovery codes mbeten vetëm në Bitwarden, Vaultwarden ose kasafortën tënde.</p></div></div>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}

    <section className="accessWorkspace">
      <header><div><h2>Qasjet</h2><p>Regjistri i infrastrukturës dhe shërbimeve të lidhura.</p></div><button className="primaryButton" onClick={openCreate}>+ Shto qasje</button></header>
      <div className="accessFilters">
        <label className="clientSearch"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kërko server, domain, provider..." /></label>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Të gjitha kategoritë</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}><option value="">Çdo pronësi</option>{Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Çdo status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>

      {loading ? <div className="taskLoading">Duke ngarkuar qasjet...</div> : entries.length ? <div className="accessTableWrap"><table className="accessTable"><thead><tr><th>Qasja</th><th>Pronësia</th><th>Provider / Adresa</th><th>Siguria</th><th>Rinovimi</th><th>Veprimet</th></tr></thead><tbody>{entries.map((entry) => {
        const serviceUrl = safeUrl(entry.serviceUrl); const vaultUrl = safeUrl(entry.vaultUrl); const renewalDays = daysUntil(entry.renewalDate);
        return <tr key={entry.id} className={entry.status !== "ACTIVE" ? "inactive" : ""}>
          <td><div className={`accessCategoryIcon category-${entry.category.toLowerCase()}`}>{categoryIcons[entry.category]}</div><div><strong>{entry.name}</strong><span>{categoryLabels[entry.category]}{entry.vaultProvider ? ` · ${vaultLabels[entry.vaultProvider]}` : ""}</span></div></td>
          <td><span className={`accessScope scope-${entry.scope.toLowerCase()}`}>{entry.scope === "CLIENT" ? entry.clientName || "Klient" : scopeLabels[entry.scope]}</span><small>{statusLabels[entry.status]}</small></td>
          <td><strong>{entry.provider || "—"}</strong><span>{entry.address || entry.serviceUrl || "Pa adresë"}</span>{entry.username && <button className="accessCopyButton" onClick={() => void copyUsername(entry)}>Kopjo username</button>}</td>
          <td><span className={`twoFactorBadge status-${entry.twoFactorStatus.toLowerCase()}`}>{twoFactorLabels[entry.twoFactorStatus]}</span>{entry.vaultReference && <small>{entry.vaultReference}</small>}</td>
          <td><strong className={renewalDays !== null && renewalDays < 0 ? "expired" : renewalDays !== null && renewalDays <= 30 ? "soon" : ""}>{renewalText(entry.renewalDate)}</strong><span>{formatDate(entry.renewalDate)}</span></td>
          <td><div className="accessActions">{serviceUrl && <a href={serviceUrl} target="_blank" rel="noreferrer noopener">Hap shërbimin</a>}{vaultUrl && <a className="vaultAction" href={vaultUrl} target="_blank" rel="noreferrer noopener">Hap kasafortën</a>}<button onClick={() => openEdit(entry)}>Edito</button><button disabled={saving} className={entry.status === "ARCHIVED" ? "restore" : "archive"} onClick={() => void changeStatus(entry, entry.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED")}>{entry.status === "ARCHIVED" ? "Aktivizo" : "Arkivo"}</button></div></td>
        </tr>;
      })}</tbody></table></div> : <div className="accessEmpty"><div>◈</div><strong>Nuk ka qasje të regjistruara</strong><p>Shto Proxmox-in, Hostinger-in ose domain-in e parë.</p><button className="primaryButton" onClick={openCreate}>+ Shto qasjen e parë</button></div>}
    </section>

    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className="clientModal accessModal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modalHeader"><div><span>{editing ? "EDITO QASJEN" : "QASJE E RE"}</span><h2>{editing ? editing.name : "Regjistro qasje"}</h2><p>Ruaj vetëm informacionin organizativ dhe lidhjen me kasafortën.</p></div><button type="button" className="modalClose" onClick={() => setOpen(false)}>×</button></div>
      <form className="accessForm" onSubmit={submit}>
        <section><h3>Të dhënat bazë</h3><div className="accessFormGrid">
          <label className="fieldWide"><span>Emri *</span><input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="P.sh. Proxmox Home" /></label>
          <label><span>Kategoria *</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as AccessCategory })}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Pronësia *</span><select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value as AccessScope, clientId: event.target.value === "CLIENT" ? form.clientId : "" })}>{Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {form.scope === "CLIENT" && <label><span>Klienti *</span><select required value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}><option value="">Zgjidh klientin</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}
          <label><span>Statusi</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AccessStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div></section>

        <section><h3>Shërbimi</h3><div className="accessFormGrid">
          <label><span>Provider</span><input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} placeholder="Hostinger, Cloudflare..." /></label>
          <label><span>Adresa / IP</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="192.168.1.10 ose hostname" /></label>
          <label className="fieldWide"><span>URL-ja e shërbimit</span><input type="url" value={form.serviceUrl} onChange={(event) => setForm({ ...form, serviceUrl: event.target.value })} placeholder="https://..." /></label>
          <label><span>Username</span><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="off" /></label>
          <label><span>2FA</span><select value={form.twoFactorStatus} onChange={(event) => setForm({ ...form, twoFactorStatus: event.target.value as TwoFactorStatus })}>{Object.entries(twoFactorLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Data e rinovimit</span><input type="date" value={form.renewalDate} onChange={(event) => setForm({ ...form, renewalDate: event.target.value })} /></label>
        </div></section>

        <section className="vaultFormSection"><div className="vaultFormHeading"><div><h3>Kasaforta</h3><p>Password-i ruhet jashtë SIRA-s.</p></div><span>Pa password</span></div><div className="accessFormGrid">
          <label><span>Kasaforta</span><select value={form.vaultProvider} onChange={(event) => setForm({ ...form, vaultProvider: event.target.value as "" | VaultProvider })}><option value="">Pa lidhje</option>{Object.entries(vaultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Referenca</span><input value={form.vaultReference} onChange={(event) => setForm({ ...form, vaultReference: event.target.value })} placeholder="P.sh. Infrastructure / Proxmox" /></label>
          <label className="fieldWide"><span>Linku i hyrjes në kasafortë</span><input type="url" value={form.vaultUrl} onChange={(event) => setForm({ ...form, vaultUrl: event.target.value })} placeholder="https://vault..." /></label>
        </div></section>

        <label className="accessNotes"><span>Shënime</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Informacione jo-sekrete për këtë qasje" /></label>
        <div className="accessNoPassword"><strong>Mos vendos password ose recovery code në shënime.</strong><span>Përdor lidhjen e kasafortës për kredencialet sekrete.</span></div>
        <div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : editing ? "Ruaj ndryshimet" : "Regjistro qasjen"}</button></div>
      </form>
    </div></div>}
  </>;
}
