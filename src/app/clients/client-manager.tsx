"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  companyName: string | null;
  clientType: "BUSINESS" | "PRIVATE";
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  taxNumber: string | null;
  website: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
}

type ClientView = "active" | "archived";
type ConfirmAction = "archive" | "delete" | null;

const emptyForm = {
  clientType: "PRIVATE" as "BUSINESS" | "PRIVATE",
  name: "", phone: "", email: "", city: "", address: "", companyName: "",
  postalCode: "", countryCode: "AT", taxNumber: "", website: "", notes: "",
};

export function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ClientView>("active");
  const [open, setOpen] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionClient, setActionClient] = useState<Client | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmName, setConfirmName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initialSearchEffect = useRef(true);
  const requestController = useRef<AbortController | null>(null);

  async function loadClients(query = "", currentView: ClientView = view, showInitialLoader = false) {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    if (showInitialLoader) setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v1/clients?search=${encodeURIComponent(query)}&view=${currentView}`,
        { cache: "no-store", signal: controller.signal },
      );
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Klientët nuk mund të ngarkohen.");
      setClients(result.data);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients("", "active", true);
    return () => requestController.current?.abort();
    // Runs once on mount only; loadClients is intentionally excluded since it's redefined every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialSearchEffect.current) {
      initialSearchEffect.current = false;
      return;
    }
    const timeout = window.setTimeout(() => void loadClients(search, view), 350);
    return () => window.clearTimeout(timeout);
    // Debounced reload keyed on search/view only; loadClients is redefined every render and would
    // otherwise retrigger this effect on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, view]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Klienti nuk mund të ruhet.");
      setForm(emptyForm); setOpen(false); setMessage("Klienti u regjistrua me sukses.");
      if (view !== "active") setView("active"); else await loadClients(search, "active");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  async function updateStatus(client: Client, status: "ACTIVE" | "ARCHIVED") {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Veprimi nuk mund të përfundohet.");
      setMessage(status === "ARCHIVED" ? "Klienti u arkivua me sukses." : "Klienti u rikthye me sukses.");
      closeConfirm();
      await loadClients(search, view);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  async function permanentlyDelete(client: Client) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/clients/${client.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Klienti nuk mund të fshihet.");
      setMessage("Klienti u fshi përfundimisht.");
      closeConfirm();
      await loadClients(search, "archived");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  function openConfirm(client: Client, action: Exclude<ConfirmAction, null>) {
    setActionClient(client); setConfirmAction(action); setConfirmName(""); setError("");
  }
  function closeConfirm() {
    setActionClient(null); setConfirmAction(null); setConfirmName("");
  }
  function openCreate() {
    setForm(emptyForm);
    setShowAdditional(false);
    setError("");
    setOpen(true);
  }

  const activeCount = useMemo(() => clients.filter((client) => client.status === "ACTIVE").length, [clients]);

  return (
    <>
      <section className="clientStats">
        <article><small>{view === "active" ? "Klientë gjithsej" : "Klientë të arkivuar"}</small><strong>{clients.length}</strong><span>Rezultatet aktuale</span></article>
        <article><small>Klientë aktivë</small><strong>{view === "active" ? activeCount : "—"}</strong><span>Status aktiv</span></article>
        <article><small>Regjistrim i shpejtë</small><strong>Të dhënat bazë</strong><span>Detajet plotësohen edhe më vonë</span></article>
      </section>

      {message && <div className="clientAlert success">{message}</div>}
      {error && <div className="clientAlert error">{error}</div>}

      <section className="clientCard">
        <div className="clientToolbar">
          <div>
            <h2>{view === "active" ? "Klientët" : "Klientë të arkivuar"}</h2>
            <p>{view === "active" ? "Regjistro dhe menaxho klientët e SIRA Platform." : "Rikthe klientët ose fshiji vetëm me konfirmim të fortë."}</p>
          </div>
          <div className="clientToolbarActions">
            <div className="clientViewTabs" aria-label="Filtri i klientëve">
              <button className={view === "active" ? "active" : ""} onClick={() => setView("active")}>Aktivë</button>
              <button className={view === "archived" ? "active" : ""} onClick={() => setView("archived")}>Të arkivuar</button>
            </div>
            <label className="clientSearch"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kërko klient..." /></label>
            {view === "active" && <button className="primaryButton" onClick={openCreate}>+ Shto klient</button>}
          </div>
        </div>

        <div className="clientTableWrap">
          <table className="clientTable">
            <thead><tr><th>Klienti</th><th>Telefoni</th><th>Emaili</th><th>Adresa</th><th>Statusi</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="tableState">Duke ngarkuar...</td></tr> : clients.length === 0 ? (
                <tr><td colSpan={6} className="tableState"><div className="emptyClientIcon">♙</div><strong>{view === "active" ? "Nuk ka klientë ende" : "Nuk ka klientë të arkivuar"}</strong><span>{view === "active" ? "Regjistro klientin e parë me butonin “Shto klient”." : "Klientët e arkivuar do të shfaqen këtu."}</span></td></tr>
              ) : clients.map((client) => (
                <tr key={client.id}>
                  <td><div className="clientIdentity"><div className="clientInitial">{client.name.charAt(0).toUpperCase()}</div><div><a className="clientNameLink" href={`/clients/${client.id}`}>{client.name}</a><small>ID #{client.id}</small></div></div></td>
                  <td>{client.phone || "—"}</td><td>{client.email || "—"}</td><td>{[client.address, client.city].filter(Boolean).join(", ") || "—"}</td>
                  <td><span className={`clientStatus ${client.status === "ARCHIVED" ? "archived" : "active"}`}>{client.status === "ARCHIVED" ? "Arkivuar" : "Aktiv"}</span></td>
                  <td>
                    <div className="clientRowActions">
                      {view === "active" ? <><a className="clientEditButton" href={`/clients/${client.id}`}>Edito</a><button className="clientArchiveButton" onClick={() => openConfirm(client, "archive")}>Arkivo</button></> : <><button className="clientRestoreButton" onClick={() => void updateStatus(client, "ACTIVE")}>Rikthe</button><button className="clientDeleteButton" onClick={() => openConfirm(client, "delete")}>Fshi</button></>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className="clientModal quickClientModal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHeader"><div><span>REGJISTRIM I SHPEJTË</span><h2>Regjistro klient të ri</h2><p>Vetëm emri është i detyrueshëm; të tjerat mund të plotësohen më vonë.</p></div><button type="button" className="modalClose" onClick={() => setOpen(false)}>×</button></div>
        <form onSubmit={submit} className="quickClientForm">
          <div className="quickClientType fieldWide"><span>Lloji i klientit</span><div><button type="button" className={form.clientType === "BUSINESS" ? "active" : ""} onClick={() => setForm({ ...form, clientType: "BUSINESS" })}>▣ Klient biznes</button><button type="button" className={form.clientType === "PRIVATE" ? "active" : ""} onClick={() => setForm({ ...form, clientType: "PRIVATE" })}>♟ Klient privat</button></div></div>
          <label><span>Emri dhe mbiemri *</span><input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="P.sh. Samir Bytyqi" /></label>
          <label><span>Emaili</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="klienti@example.com" /></label>
          <label><span>Telefoni</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+43 ..." /></label>
          <label><span>Qyteti</span><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="P.sh. Graz" /></label>
          <div className="quickClientAdditional fieldWide">
            <button type="button" className={showAdditional ? "open" : ""} onClick={() => setShowAdditional((value) => !value)}><span className="quickClientPlus">{showAdditional ? "−" : "+"}</span><span><strong>Të dhëna shtesë</strong><small>Kompania, adresa, UID, website dhe shënime</small></span><em>{showAdditional ? "Mbyll ↑" : "Hape →"}</em></button>
            {showAdditional && <div className="quickClientAdditionalGrid">
              {form.clientType === "BUSINESS" && <label><span>Emri i kompanisë</span><input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>}
              <label><span>Rruga dhe numri</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
              <label><span>Kodi postar</span><input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label>
              <label><span>Shteti</span><input maxLength={2} value={form.countryCode} onChange={(event) => setForm({ ...form, countryCode: event.target.value.toUpperCase() })} placeholder="AT" /></label>
              <label><span>Numri fiskal / UID</span><input value={form.taxNumber} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} /></label>
              <label><span>Website</span><input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://..." /></label>
              <label className="fieldWide"><span>Shënime</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
            </div>}
          </div>
          <div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button type="submit" className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : "Ruaj klientin"}</button></div>
        </form>
      </div></div>}

      {actionClient && confirmAction && <div className="modalBackdrop" onMouseDown={closeConfirm}><div className="confirmModal" onMouseDown={(event) => event.stopPropagation()}>
        <div className={`confirmIcon ${confirmAction}`}>{confirmAction === "archive" ? "↘" : "!"}</div>
        <h2>{confirmAction === "archive" ? "Arkivo klientin?" : "Fshirje përfundimtare"}</h2>
        {confirmAction === "archive" ? <p>Klienti <strong>{actionClient.name}</strong> nuk do të shfaqet më në listën aktive, por të dhënat e tij do të ruhen dhe mund të rikthehen.</p> : <><p>Ky veprim nuk mund të zhbëhet. Për konfirmim, shkruaj saktësisht emrin e klientit:</p><strong className="confirmClientName">{actionClient.name}</strong><input className="confirmNameInput" value={confirmName} onChange={(event) => setConfirmName(event.target.value)} placeholder={actionClient.name} autoFocus /></>}
        <div className="confirmActions"><button className="secondaryButton" onClick={closeConfirm}>Anulo</button>{confirmAction === "archive" ? <button className="archiveConfirmButton" disabled={saving} onClick={() => void updateStatus(actionClient, "ARCHIVED")}>{saving ? "Duke arkivuar..." : "Arkivo klientin"}</button> : <button className="dangerButton" disabled={saving || confirmName !== actionClient.name} onClick={() => void permanentlyDelete(actionClient)}>{saving ? "Duke fshirë..." : "Fshi përfundimisht"}</button>}</div>
      </div></div>}
    </>
  );
}
