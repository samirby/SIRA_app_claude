"use client";

import { FormEvent, useEffect, useState } from "react";

interface TaskLabel {
  id: number;
  name: string;
  color: string;
}

const defaultColor = "#F4C542";

export function TaskLabelSettings() {
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColor);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadLabels() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/labels", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Label-at nuk mund të ngarkohen.");
      setLabels(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadLabels(); }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setColor(defaultColor);
  }

  async function saveLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/v1/labels/${editingId}` : "/api/v1/labels", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Label nuk mund të ruhet.");
      setLabels((items) => {
        const next = editingId
          ? items.map((item) => item.id === result.data.id ? result.data : item)
          : items.some((item) => item.id === result.data.id) ? items : [...items, result.data];
        return next.sort((a, b) => a.name.localeCompare(b.name, "sq"));
      });
      setMessage(editingId ? "Label u përditësua." : "Label u krijua dhe mund të zgjidhet te detyrat.");
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      setSaving(false);
    }
  }

  function editLabel(label: TaskLabel) {
    setEditingId(label.id);
    setName(label.name);
    setColor(label.color);
    setError("");
    setMessage("");
  }

  async function removeLabel(label: TaskLabel) {
    if (!window.confirm(`Ta fshijmë label-in “${label.name}”? Label-i do të largohet edhe nga detyrat ku është përdorur.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/v1/labels/${label.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Label nuk mund të fshihet.");
      setLabels((items) => items.filter((item) => item.id !== label.id));
      if (editingId === label.id) resetForm();
      setMessage("Label u fshi.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="taskLabelSettings">
    {message && <div className="clientAlert success">{message}</div>}
    {error && <div className="clientAlert error">{error}</div>}

    <form className="taskLabelSettingsForm" onSubmit={saveLabel}>
      <div>
        <label><span>Emri i kategorisë</span><input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="P.sh. Graphic Design" /></label>
        <label className="taskLabelColorField"><span>Ngjyra</span><div><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></div></label>
      </div>
      <div className="taskLabelSettingsActions">
        {editingId && <button type="button" className="secondaryButton" onClick={resetForm}>Anulo</button>}
        <button className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : editingId ? "Ruaj ndryshimet" : "+ Krijo label"}</button>
      </div>
    </form>

    <div className="taskLabelSettingsHeader"><div><h4>Label-at e krijuar</h4><p>Zgjidhi gjatë krijimit ose editimit të një detyre.</p></div><strong>{labels.length}</strong></div>
    {loading ? <div className="settingsEmptyState">Duke ngarkuar label-at...</div> : labels.length ? <div className="taskLabelSettingsList">{labels.map((label) => <article key={label.id}>
      <div className="taskLabelPreview" style={{ borderColor: label.color }}><i style={{ backgroundColor: label.color }} /><strong>{label.name}</strong><span>{label.color.toUpperCase()}</span></div>
      <div><button type="button" className="secondaryButton" disabled={saving} onClick={() => editLabel(label)}>Edito</button><button type="button" className="taskLabelDelete" disabled={saving} onClick={() => void removeLabel(label)}>Fshi</button></div>
    </article>)}</div> : <div className="settingsEmptyState">Nuk ka label ende. Krijo kategorinë e parë të punës.</div>}
  </div>;
}
