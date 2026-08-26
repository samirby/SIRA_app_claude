"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { RecommendationsPanel } from "@/app/recommendations/recommendations-panel";

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
  updatedAt: string;
}

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  companyName: string;
  clientType: "BUSINESS" | "PRIVATE";
  city: string;
  postalCode: string;
  countryCode: string;
  taxNumber: string;
  website: string;
  notes: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

function toForm(client: Client): ClientForm {
  return {
    name: client.name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    companyName: client.companyName ?? "",
    clientType: client.clientType,
    city: client.city ?? "",
    postalCode: client.postalCode ?? "",
    countryCode: client.countryCode ?? "",
    taxNumber: client.taxNumber ?? "",
    website: client.website ?? "",
    notes: client.notes ?? "",
    status: client.status,
  };
}

function value(value: string | null) {
  return value?.trim() || "—";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ClientProfile({ clientId }: { clientId: number }) {
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadClient() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/clients/${clientId}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result?.error?.message || "Klienti nuk mund të ngarkohet.");
      }
      setClient(result.data);
      setForm(toForm(result.data));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClient();
    // loadClient is redefined every render but only reads clientId (already a dep); re-running on every
    // render would cause redundant fetches, so it's intentionally left out of the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const initials = useMemo(() => {
    if (!client?.name) return "K";
    return client.name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  }, [client]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/v1/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result?.error?.message || "Ndryshimet nuk mund të ruhen.");
      }
      setClient(result.data);
      setForm(toForm(result.data));
      setEditing(false);
      setMessage("Të dhënat e klientit u përditësuan me sukses.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (client) setForm(toForm(client));
    setEditing(false);
    setError("");
  }

  if (loading) {
    return <section className="clientProfileState">Duke ngarkuar profilin e klientit...</section>;
  }

  if (error && !client) {
    return (
      <section className="clientProfileState errorState">
        <strong>Profili nuk mund të hapej</strong>
        <span>{error}</span>
        <button className="secondaryButton" onClick={() => void loadClient()}>Provo përsëri</button>
      </section>
    );
  }

  if (!client || !form) return null;

  return (
    <>
      <div className="clientProfileTopbar">
        <Link className="backLink" href="/clients">← Kthehu te klientët</Link>
        <div className="clientProfileActions">
          {!editing ? (
            <button className="primaryButton" onClick={() => { setEditing(true); setMessage(""); }}>Edito klientin</button>
          ) : null}
        </div>
      </div>

      {message && <div className="clientAlert success">{message}</div>}
      {error && client && <div className="clientAlert error">{error}</div>}

      <section className="clientProfileHero">
        <div className="clientProfileAvatar">{initials}</div>
        <div className="clientProfileHeading">
          <div className="clientProfileTitleRow">
            <h2>{client.name}</h2>
            <span className={`clientStatus ${client.status === "ARCHIVED" ? "archived" : "active"}`}>
              {client.status === "ARCHIVED" ? "Arkivuar" : client.status === "INACTIVE" ? "Jo aktiv" : "Aktiv"}
            </span>
          </div>
          <p>{client.companyName || (client.clientType === "BUSINESS" ? "Klient biznesi" : "Klient privat")}</p>
          <div className="clientProfileMeta">
            <span>ID #{client.id}</span>
            <span>Regjistruar: {formatDate(client.createdAt)}</span>
            <span>Përditësuar: {formatDate(client.updatedAt)}</span>
          </div>
        </div>
      </section>

      {!editing ? (
        <div className="clientProfileGrid">
          <section className="profileCard">
            <div className="profileCardHeader"><h3>Informacionet bazë</h3></div>
            <dl className="profileDetails">
              <div><dt>Emri</dt><dd>{value(client.name)}</dd></div>
              <div><dt>Kompania</dt><dd>{value(client.companyName)}</dd></div>
              <div><dt>Lloji i klientit</dt><dd>{client.clientType === "BUSINESS" ? "Biznes" : "Privat"}</dd></div>
              <div><dt>Statusi</dt><dd>{client.status === "ACTIVE" ? "Aktiv" : client.status === "INACTIVE" ? "Jo aktiv" : "Arkivuar"}</dd></div>
            </dl>
          </section>

          <section className="profileCard">
            <div className="profileCardHeader"><h3>Kontakti</h3></div>
            <dl className="profileDetails">
              <div><dt>Telefoni</dt><dd>{value(client.phone)}</dd></div>
              <div><dt>Emaili</dt><dd>{value(client.email)}</dd></div>
              <div><dt>Website</dt><dd>{value(client.website)}</dd></div>
            </dl>
          </section>

          <section className="profileCard">
            <div className="profileCardHeader"><h3>Adresa</h3></div>
            <dl className="profileDetails">
              <div><dt>Rruga dhe numri</dt><dd>{value(client.address)}</dd></div>
              <div><dt>Kodi postar</dt><dd>{value(client.postalCode)}</dd></div>
              <div><dt>Qyteti</dt><dd>{value(client.city)}</dd></div>
              <div><dt>Shteti</dt><dd>{value(client.countryCode)}</dd></div>
            </dl>
          </section>

          <section className="profileCard">
            <div className="profileCardHeader"><h3>Të dhënat administrative</h3></div>
            <dl className="profileDetails">
              <div><dt>Numri fiskal / UID</dt><dd>{value(client.taxNumber)}</dd></div>
            </dl>
          </section>

          <section className="profileCard profileCardWide">
            <div className="profileCardHeader"><h3>Shënime</h3></div>
            <p className="profileNotes">{value(client.notes)}</p>
          </section>

          <section className="profileCard profileCardWide">
            <RecommendationsPanel embedded clientId={client.id} clientName={client.name} />
          </section>

          <section className="profileCard profileCardWide profileFutureCard">
            <div className="profileCardHeader"><h3>Aktivitetet e klientit</h3><span>Në zhvillim</span></div>
            <div className="futureModuleGrid">
              <div><strong>Projektet</strong><span>0</span></div>
              <div><strong>Faturat</strong><span>0</span></div>
              <div><strong>Kontratat</strong><span>0</span></div>
              <div><strong>Ticket-at</strong><span>0</span></div>
            </div>
          </section>
        </div>
      ) : (
        <form className="clientEditForm" onSubmit={submit}>
          <section className="profileCard profileCardWide">
            <div className="profileCardHeader"><div><h3>Edito të dhënat</h3><p>Plotëso informacionet e nevojshme për klientin.</p></div></div>
            <div className="clientEditGrid">
              <label><span>Emri *</span><input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label><span>Emri i kompanisë</span><input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
              <label><span>Lloji i klientit</span><select value={form.clientType} onChange={(event) => setForm({ ...form, clientType: event.target.value as ClientForm["clientType"] })}><option value="PRIVATE">Privat</option><option value="BUSINESS">Biznes</option></select></label>
              <label><span>Statusi</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientForm["status"] })}><option value="ACTIVE">Aktiv</option><option value="INACTIVE">Jo aktiv</option><option value="ARCHIVED">Arkivuar</option></select></label>
              <label><span>Telefoni</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label><span>Emaili</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label><span>Website</span><input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://..." /></label>
              <label><span>Numri fiskal / UID</span><input value={form.taxNumber} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} /></label>
              <label className="fieldWide"><span>Rruga dhe numri</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
              <label><span>Kodi postar</span><input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label>
              <label><span>Qyteti</span><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
              <label><span>Shteti (Kodi)</span><input maxLength={2} value={form.countryCode} onChange={(event) => setForm({ ...form, countryCode: event.target.value.toUpperCase() })} placeholder="AT" /></label>
              <label className="fieldWide"><span>Shënime</span><textarea rows={5} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
            </div>
            <div className="clientEditActions">
              <button type="button" className="secondaryButton" onClick={cancelEdit}>Anulo</button>
              <button type="submit" className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : "Ruaj ndryshimet"}</button>
            </div>
          </section>
        </form>
      )}
    </>
  );
}
