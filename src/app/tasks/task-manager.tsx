"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "COMPLETED";
type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type BillingStatus = "NOT_BILLABLE" | "NOT_READY" | "PENDING" | "DRAFTED" | "INVOICED";
type SubjectType = "CLIENT" | "PERSON";
type TaskWorkType = "STANDALONE" | "PROJECT";
type ProjectTaskBillingType = "INCLUDED" | "EXTRA_BILLABLE" | "NON_BILLABLE";
interface Client { id: number; name: string; }
interface Project { id: number; clientId: number | null; name: string; clientName: string | null; status: string; }
interface ProjectMilestoneOption { id: number; name: string; status: string; }
interface EmbeddedProjectContext { id: number; clientId: number; name: string; clientName: string | null; milestones?: ProjectMilestoneOption[]; }
interface TaskManagerProps { projectContext?: EmbeddedProjectContext; embedded?: boolean; milestoneFilterId?: number | null; milestoneFilterName?: string | null; onTasksChanged?: () => void; }
interface Label { id: number; name: string; color: string; }
interface Subtask { id: number; title: string; completed: boolean; }
interface Task {
  id: number; subjectType: SubjectType; clientId: number | null; clientName: string | null;
  personName: string | null; subjectName: string; projectId: number | null; projectName: string | null;
  projectMilestoneId: number | null; projectMilestoneName: string | null;
  projectBillingType: ProjectTaskBillingType;
  invoiceId: number | null; invoiceNumber: string | null; title: string; description: string | null;
  priority: TaskPriority; status: TaskStatus; startDate: string | null; dueDate: string | null;
  estimatedMinutes: number; spentMinutes: number; billable: boolean; billingType: "FIXED" | "HOURLY";
  invoiceDescription: string | null; quantity: number; unitPrice: number; hourlyCostRate: number; vatRate: number;
  discountPercent: number; billingStatus: BillingStatus; billingTotal: number;
  subtasks: Subtask[]; labels: Label[];
}

interface TaskForm {
  subjectType: SubjectType; clientId: string; personName: string; projectId: string; projectMilestoneId: string;
  projectBillingType: ProjectTaskBillingType;
  title: string; description: string; priority: TaskPriority; status: TaskStatus;
  startDate: string; dueDate: string; estimatedHours: string; billable: boolean;
  billingType: "FIXED" | "HOURLY"; invoiceDescription: string; quantity: string;
  unitPrice: string; hourlyCostRate: string; vatRate: string; discountPercent: string; labelIds: number[];
}

const emptyForm: TaskForm = {
  subjectType: "CLIENT", clientId: "", personName: "", projectId: "", projectMilestoneId: "", projectBillingType: "NON_BILLABLE", title: "", description: "",
  priority: "NORMAL", status: "NEW", startDate: "", dueDate: "", estimatedHours: "",
  billable: false, billingType: "FIXED", invoiceDescription: "", quantity: "1",
  unitPrice: "0", hourlyCostRate: "0", vatRate: "20", discountPercent: "0", labelIds: [],
};

const statusColumns: Array<{ value: TaskStatus; label: string; hint: string }> = [
  { value: "NEW", label: "E re", hint: "Punë të planifikuara" },
  { value: "IN_PROGRESS", label: "Në punë", hint: "Duke u realizuar" },
  { value: "WAITING", label: "Në pritje", hint: "Kërkojnë përgjigje" },
  { value: "COMPLETED", label: "Përfunduar", hint: "Punë të kryera" },
];
const priorityLabels: Record<TaskPriority, string> = { LOW: "Ulët", NORMAL: "Normal", HIGH: "Lartë", URGENT: "Urgjent" };
const billingTypeLabels: Record<ProjectTaskBillingType, string> = { INCLUDED: "E përfshirë", EXTRA_BILLABLE: "Shtesë me pagesë", NON_BILLABLE: "Pa pagesë" };
const billingLabels: Record<BillingStatus, string> = {
  NOT_BILLABLE: "Pa faturim", NOT_READY: "Jo e faturuar", PENDING: "Pret faturim",
  DRAFTED: "Në draft faturë", INVOICED: "E faturuar",
};

function hoursToMinutes(value: string) { return Math.max(0, Math.round((Number(value) || 0) * 60)); }
function formatHours(minutes: number) {
  if (!minutes) return "0 orë";
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} orë`;
}
function euro(value: number) { return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value); }
function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
function labelTextColor(color: string) {
  const hex = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 165 ? "#102a43" : "#ffffff";
}
function toForm(task: Task): TaskForm {
  return {
    subjectType: task.subjectType, clientId: task.clientId ? String(task.clientId) : "",
    personName: task.personName ?? "", projectId: task.projectId ? String(task.projectId) : "",
    projectMilestoneId: task.projectMilestoneId ? String(task.projectMilestoneId) : "",
    projectBillingType: task.projectBillingType,
    title: task.title, description: task.description ?? "", priority: task.priority, status: task.status,
    startDate: task.startDate ?? "", dueDate: task.dueDate ?? "",
    estimatedHours: task.estimatedMinutes ? String(task.estimatedMinutes / 60) : "",
    billable: task.billable, billingType: task.billingType,
    invoiceDescription: task.invoiceDescription ?? "", quantity: String(task.quantity),
    unitPrice: String(task.unitPrice), hourlyCostRate: String(task.hourlyCostRate), vatRate: String(task.vatRate),
    discountPercent: String(task.discountPercent), labelIds: task.labels.map((label) => label.id),
  };
}

export function TaskManager({ projectContext, embedded = false, milestoneFilterId = null, milestoneFilterName = null, onTasksChanged }: TaskManagerProps = {}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestoneOption[]>(projectContext?.milestones ?? []);
  const [labels, setLabels] = useState<Label[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [workType, setWorkType] = useState<TaskWorkType>("STANDALONE");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [billingFilter, setBillingFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const editQueryHandled = useRef(false);

  async function loadTasks(showLoader = false) {
    requestController.current?.abort();
    const controller = new AbortController(); requestController.current = controller;
    if (showLoader) setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (priorityFilter) params.set("priority", priorityFilter);
    if (billingFilter) params.set("billingStatus", billingFilter);
    if (clientFilter) params.set("clientId", clientFilter);
    if (projectContext) params.set("projectId", String(projectContext.id));
    try {
      const response = await fetch(`/api/v1/tasks?${params}`, { cache: "no-store", signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyrat nuk mund të ngarkohen.");
      const loadedTasks = result.data as Task[];
      setTasks(loadedTasks);
      if (!editQueryHandled.current) {
        editQueryHandled.current = true;
        const editId = Number(new URLSearchParams(window.location.search).get("edit"));
        const requestedTask = editId > 0 ? loadedTasks.find((task) => task.id === editId) : null;
        if (requestedTask) {
          openEdit(requestedTask);
          const url = new URL(window.location.href);
          url.searchParams.delete("edit");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }

  async function loadOptions() {
    try {
      const responses = await Promise.all([
        fetch("/api/v1/clients?view=active", { cache: "no-store" }),
        fetch("/api/v1/projects?active=1", { cache: "no-store" }),
        fetch("/api/v1/labels", { cache: "no-store" }),
      ]);
      const results = await Promise.all(responses.map((response) => response.json()));
      if (responses[0].ok && results[0].ok) setClients(results[0].data);
      if (responses[1].ok && results[1].ok) {
        const loadedProjects = results[1].data as Project[];
        setProjects(projectContext && !loadedProjects.some((project) => project.id === projectContext.id)
          ? [...loadedProjects, { ...projectContext, status: "OPEN" }]
          : loadedProjects);
      }
      if (responses[2].ok && results[2].ok) setLabels(results[2].data);
    } catch { /* Main task request reports the useful error. */ }
  }

  useEffect(() => {
    void Promise.all([loadTasks(true), loadOptions()]);
    return () => requestController.current?.abort();
    // Runs once on mount only; loadTasks/loadOptions are redefined every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTasks(), 300);
    return () => window.clearTimeout(timeout);
    // Debounced reload keyed on the filter values only; loadTasks is redefined every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, priorityFilter, billingFilter, clientFilter]);
  useEffect(() => {
    const projectId = Number(form.projectId);
    if (!projectId) { setMilestones([]); return; }
    if (projectContext?.id === projectId && projectContext.milestones) {
      setMilestones(projectContext.milestones);
      return;
    }
    let active = true;
    void fetch(`/api/v1/projects/${projectId}/workspace`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => { if (active && result.ok) setMilestones(result.data.milestones ?? []); })
      .catch(() => { if (active) setMilestones([]); });
    return () => { active = false; };
  }, [form.projectId, projectContext?.id, projectContext?.milestones]);

  function openCreate() {
    setEditingTask(null);
    setForm(projectContext ? { ...emptyForm, subjectType: "CLIENT", clientId: String(projectContext.clientId), projectId: String(projectContext.id), projectMilestoneId: milestoneFilterId ? String(milestoneFilterId) : "", projectBillingType: "INCLUDED" } : emptyForm);
    setWorkType(projectContext ? "PROJECT" : "STANDALONE"); setError(""); setOpen(true);
  }
  function openEdit(task: Task) { setEditingTask(task); setForm(toForm(task)); setWorkType(task.projectId ? "PROJECT" : "STANDALONE"); setError(""); setOpen(true); }
  function setSubjectType(subjectType: SubjectType) {
    setForm((current) => ({
      ...current, subjectType, clientId: subjectType === "CLIENT" ? current.clientId : "",
      personName: subjectType === "PERSON" ? current.personName : "",
      billable: subjectType === "PERSON" ? false : current.billable,
    }));
  }
  function payloadFromForm() {
    return {
      subjectType: form.subjectType,
      clientId: form.subjectType === "CLIENT" ? Number(form.clientId) : null,
      personName: form.subjectType === "PERSON" ? form.personName : null,
      projectId: form.projectId ? Number(form.projectId) : null,
      projectMilestoneId: form.projectMilestoneId ? Number(form.projectMilestoneId) : null,
      projectName: null,
      projectBillingType: form.projectId ? form.projectBillingType : "NON_BILLABLE",
      title: form.title, description: form.description || null, assigneeName: null,
      priority: form.priority, status: form.status, startDate: form.startDate || null,
      dueDate: form.dueDate || null, estimatedMinutes: hoursToMinutes(form.estimatedHours),
      spentMinutes: editingTask?.spentMinutes ?? 0, notes: null, billable: form.billable,
      billingType: form.billingType, invoiceDescription: form.invoiceDescription || form.title,
      quantity: Number(form.quantity) || 1, unitPrice: Number(form.unitPrice) || 0,
      hourlyCostRate: Number(form.hourlyCostRate) || 0,
      vatRate: Number(form.vatRate) || 0, discountPercent: Number(form.discountPercent) || 0,
      labelIds: form.labelIds,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(editingTask ? `/api/v1/tasks/${editingTask.id}` : "/api/v1/tasks", {
        method: editingTask ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm()),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të ruhet.");
      setOpen(false);
      if (editingTask) {
        setMessage("Detyra u përditësua me sukses.");
        await loadTasks();
        onTasksChanged?.();
      } else {
        onTasksChanged?.();
        if (embedded) {
          setMessage("Detyra u krijua dhe u lidh automatikisht me projektin.");
          await loadTasks();
        } else {
          const created = result.data as Task;
          // Nëse detyra u lidh me një projekt, hap direkt projektin te faza ku u vendos detyra
          // (jo faqen e vetë detyrës) — kështu shihet menjëherë konteksti i saj te Kanban-i i fazës.
          if (created.projectId) {
            router.push(created.projectMilestoneId
              ? `/projects/${created.projectId}?milestone=${created.projectMilestoneId}`
              : `/projects/${created.projectId}`);
          } else {
            router.push(`/tasks/${created.id}`);
          }
        }
      }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function patchTask(taskId: number, payload: Record<string, unknown>, successMessage?: string) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të përditësohet.");
      setTasks((items) => items.map((item) => item.id === taskId ? result.data : item));
      onTasksChanged?.();
      if (successMessage) setMessage(successMessage);
      return result.data as Task;
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); return null; }
    finally { setSaving(false); }
  }

  async function deleteTaskItem(task: Task) {
    if (!window.confirm(`A je i sigurt që dëshiron ta fshish detyrën “${task.title}”?`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/tasks/${task.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të fshihet.");
      setTasks((items) => items.filter((item) => item.id !== task.id));
      if (editingTask?.id === task.id) { setOpen(false); setEditingTask(null); }
      onTasksChanged?.();
      setMessage("Detyra u fshi me sukses.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur.");
    } finally { setSaving(false); }
  }

  async function queueForBilling(taskId: number) {
    const response = await fetch(`/api/v1/tasks/${taskId}/billing`, { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të kalojë për faturim.");
    setTasks((items) => items.map((item) => item.id === taskId ? result.data : item));
  }

  async function finishTask(mode: "BILL_NOW" | "BILL_LATER" | "NO_BILLING") {
    if (!completionTask) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const projectTask = Boolean(completionTask.projectId);
      const updated = await patchTask(completionTask.id, projectTask
        ? { status: "COMPLETED" }
        : mode === "NO_BILLING" ? { status: "COMPLETED", billable: false } : { status: "COMPLETED" });
      if (!updated) return;
      if (!projectTask && mode === "BILL_NOW") await queueForBilling(completionTask.id);
      setCompletionTask(null);
      setMessage(!projectTask && mode === "BILL_NOW" ? "Detyra u përfundua dhe kaloi për faturim." : "Detyra u përfundua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    if (status === "COMPLETED") { setCompletionTask(task); return; }
    await patchTask(task.id, { status }, "Statusi u ndryshua.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const visibleTasks = useMemo(() => milestoneFilterId ? tasks.filter((task) => task.projectMilestoneId === milestoneFilterId) : tasks, [tasks, milestoneFilterId]);
  const stats = useMemo(() => ({
    active: visibleTasks.filter((task) => task.status !== "COMPLETED").length,
    overdue: visibleTasks.filter((task) => task.status !== "COMPLETED" && task.dueDate && task.dueDate < today).length,
    pendingBilling: visibleTasks.filter((task) => task.billingStatus === "PENDING").length,
    completed: visibleTasks.filter((task) => task.status === "COMPLETED").length,
  }), [visibleTasks, today]);
  const formTotal = useMemo(() => {
    const gross = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);
    const net = gross * (1 - (Number(form.discountPercent) || 0) / 100);
    return net * (1 + (Number(form.vatRate) || 0) / 100);
  }, [form.quantity, form.unitPrice, form.discountPercent, form.vatRate]);
  const availableProjects = useMemo(() => {
    if (form.subjectType !== "CLIENT" || !form.clientId) return projects;
    const clientId = Number(form.clientId);
    return projects.filter((project) => project.clientId === null || project.clientId === clientId);
  }, [projects, form.subjectType, form.clientId]);

  function openTask(taskId: number) { router.push(`/tasks/${taskId}`); }
  function TaskCard({ task }: { task: Task }) {
    const overdue = task.status !== "COMPLETED" && Boolean(task.dueDate && task.dueDate < today);
    return <article className="taskCard taskCardClickable">
      <Link className="taskCardOpenLink" href={`/tasks/${task.id}`} aria-label={`Hap detyrën ${task.title}`} />
      <div className="taskCardTop">
        <span className={`taskPriority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>
        <div className="taskCardControls">
          <span className="taskDragHandle" title="Tërhiq detyrën" aria-label="Tërhiq detyrën" draggable={!saving}
            onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDraggedTaskId(task.id); }}
            onDragEnd={() => setDraggedTaskId(null)}>⠿</span>
          <button type="button" className="taskEdit" onClick={() => openEdit(task)}>Edito</button>
          <button type="button" className="taskDelete" disabled={saving} onClick={() => void deleteTaskItem(task)}>Fshi</button>
        </div>
      </div>
      <h3>{task.title}</h3>
      {task.labels.length > 0 && <div className="taskLabelRow">{task.labels.map((label) => <span key={label.id} className="taskLabel taskLabelColored" style={{ backgroundColor: label.color, borderColor: label.color, color: labelTextColor(label.color) }}>{label.name}</span>)}</div>}
      <div className="taskMeta">
        {task.projectName && <span><em>Projekti</em><strong>{task.projectName}</strong></span>}
        {task.projectMilestoneName && <span><em>Faza</em><strong>{task.projectMilestoneName}</strong></span>}
        <span><em>{task.subjectType === "CLIENT" ? "Klienti" : "Personi"}</em><strong>{task.subjectName}</strong></span>
        <span className={overdue ? "taskDueDate overdue" : "taskDueDate"}><em>Afati</em><strong>{task.dueDate ? `${overdue ? "Vonuar · " : ""}${formatDate(task.dueDate)}` : "Pa afat"}</strong></span>
      </div>
    </article>;
  }

  return <>
    <div className={embedded ? "embeddedTaskManager" : ""}><section className="taskStats"><article><small>Detyra aktive</small><strong>{stats.active}</strong><span>Në punë, të reja ose në pritje</span></article><article><small>Afate të kaluara</small><strong className={stats.overdue ? "dangerText" : ""}>{stats.overdue}</strong><span>Kërkojnë veprim</span></article><article><small>Pret faturim</small><strong>{stats.pendingBilling}</strong><span>Punë të gatshme për faturë</span></article><article><small>Të përfunduara</small><strong>{stats.completed}</strong><span>Rezultatet aktuale</span></article></section>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}
    <section className="taskWorkspace">
      <div className="taskToolbar"><div><h2>{milestoneFilterName ? `Kanban · ${milestoneFilterName}` : projectContext ? "Detyrat e projektit" : "Detyrat & Punët"}</h2><p>{milestoneFilterName ? "Vetëm detyrat e fazës së zgjedhur." : "Kliko kartën për orë, procesin e punës, kosto dhe historik."}</p></div><div className="taskToolbarActions"><div className="clientViewTabs"><button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}>Kanban</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Listë</button></div><button className="primaryButton" onClick={openCreate}>+ Shto detyrë</button></div></div>
      <div className="taskFilters"><label className="clientSearch"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kërko detyrë..." /></label><select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="">Të gjithë klientët</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="">Çdo prioritet</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value)}><option value="">Çdo status faturimi</option>{Object.entries(billingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {loading ? <div className="taskLoading">Duke ngarkuar detyrat...</div> : view === "kanban" ? <div className="taskBoard">{statusColumns.map((column) => { const columnTasks = visibleTasks.filter((task) => task.status === column.value); return <section key={column.value} className={`taskColumn status-${column.value.toLowerCase()} ${draggedTaskId ? "dragActive" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={() => { const task = visibleTasks.find((item) => item.id === draggedTaskId); if (task) void changeStatus(task, column.value); }}><header><div><h3>{column.label}</h3><span>{column.hint}</span></div><strong>{columnTasks.length}</strong></header><div className="taskColumnBody">{columnTasks.length ? columnTasks.map((task) => <TaskCard key={task.id} task={task} />) : <div className="taskColumnEmpty">Tërhiq një detyrë këtu</div>}</div></section>; })}</div> : <div className="taskTableWrap"><table className="taskTable"><thead><tr><th>Detyra</th><th>Klienti / Personi</th><th>Projekti</th><th>Prioriteti</th><th>Statusi</th><th>Koha</th><th /></tr></thead><tbody>{visibleTasks.length ? visibleTasks.map((task) => <tr key={task.id} className="taskTableRow" onClick={() => openTask(task.id)}><td><strong>{task.title}</strong><small>{task.labels.map((label) => label.name).join(" · ") || "Pa label"}</small></td><td>{task.subjectName}</td><td>{task.projectName || "—"}</td><td><span className={`taskPriority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span></td><td>{statusColumns.find((item) => item.value === task.status)?.label}</td><td>{formatHours(task.spentMinutes)}</td><td><div className="taskTableActions"><button className="taskEdit" onClick={(event) => { event.stopPropagation(); openEdit(task); }}>Edito</button><button className="taskDelete" disabled={saving} onClick={(event) => { event.stopPropagation(); void deleteTaskItem(task); }}>Fshi</button></div></td></tr>) : <tr><td colSpan={7} className="tableState">Kjo fazë nuk ka ende detyra.</td></tr>}</tbody></table></div>}
    </section></div>

    {open && <div className="modalBackdrop" onMouseDown={() => !saving && setOpen(false)}><div className={`taskModal ${editingTask ? "taskEditModal" : "quickTaskModal"}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modalHeader"><div><span>{editingTask ? "EDITIM I DETYRËS" : "DETYRË E RE"}</span><h2>{editingTask ? editingTask.title : "Detyrë e re"}</h2><p>{editingTask ? "Ndrysho të dhënat dhe parametrat e detyrës." : projectContext ? `Do të lidhet automatikisht me projektin “${projectContext.name}”.` : "Zgjidh nëse lidhet me projektin apo është punë e veçantë."}</p></div><button type="button" className="modalClose" onClick={() => setOpen(false)}>×</button></div>
      <form className="taskForm" onSubmit={submit}>
        {!editingTask ? <section className="quickTaskSection"><div className="quickTaskFormGrid">
          {!projectContext && <>
          <div className="fieldWide relationPicker compactRelationPicker"><span>Lidhur me *</span><div><button type="button" disabled={Boolean(projectContext)} className={form.subjectType === "CLIENT" ? "active" : ""} onClick={() => setSubjectType("CLIENT")}>Klient</button><button type="button" disabled={Boolean(projectContext)} className={form.subjectType === "PERSON" ? "active" : ""} onClick={() => setSubjectType("PERSON")}>Person</button></div></div>
          {form.subjectType === "CLIENT" ? <label><span>Klienti *</span><select required disabled={Boolean(projectContext)} value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value, projectId: "", projectMilestoneId: "" })}><option value="">Zgjidh klientin</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label> : <label><span>Personi *</span><input required minLength={2} value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} placeholder="Emri dhe mbiemri" /></label>}
          <label><span>Lloji i punës *</span><select disabled={Boolean(projectContext)} value={workType} onChange={(event) => { const nextType = event.target.value as TaskWorkType; setWorkType(nextType); setForm((current) => ({ ...current, projectId: nextType === "STANDALONE" ? "" : current.projectId, projectMilestoneId: nextType === "STANDALONE" ? "" : current.projectMilestoneId, projectBillingType: nextType === "PROJECT" ? "INCLUDED" : "NON_BILLABLE", billable: false })); }}><option value="STANDALONE">Punë e veçantë</option><option value="PROJECT">Detyrë e projektit</option></select></label>
          {workType === "PROJECT" && <><label><span>Projekti *</span><select required disabled={Boolean(projectContext)} value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value, projectMilestoneId: "" })}><option value="">Zgjidh projektin</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.clientName ? ` · ${project.clientName}` : ""}</option>)}</select></label><label><span>Faturimi i detyrës</span><select value={form.projectBillingType} onChange={(event) => { const value = event.target.value as ProjectTaskBillingType; setForm({ ...form, projectBillingType: value, billable: value === "EXTRA_BILLABLE" }); }}><option value="INCLUDED">E përfshirë në projekt</option><option value="EXTRA_BILLABLE">Shtesë me pagesë</option><option value="NON_BILLABLE">Pa pagesë</option></select></label>{form.projectBillingType === "EXTRA_BILLABLE" && <label><span>Çmimi shtesë (€)</span><input required type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} /></label>}</>}
          </>}
          {form.projectId && <label><span>Faza e projektit</span><select value={form.projectMilestoneId} onChange={(event) => setForm({ ...form, projectMilestoneId: event.target.value })}><option value="">Pa fazë</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.name}</option>)}</select></label>}
          <label className="fieldWide"><span>Titulli *</span><input required minLength={2} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="P.sh. Përgatit vizitkartën" /></label>
          <label className="fieldWide"><span>Përshkrimi</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Përshkrim i shkurtër i punës" /></label>
          <label><span>Prioriteti</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Afati</span><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        </div></section> : <>
          <section><h3>Puna</h3><div className="taskFormGrid">
            <div className="fieldWide relationPicker"><span>Lidhur me *</span><div><button type="button" className={form.subjectType === "CLIENT" ? "active" : ""} onClick={() => setSubjectType("CLIENT")}>Klient</button><button type="button" className={form.subjectType === "PERSON" ? "active" : ""} onClick={() => setSubjectType("PERSON")}>Person</button></div></div>
            {form.subjectType === "CLIENT" ? <label><span>Klienti *</span><select required value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}><option value="">Zgjidh klientin</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label> : <label><span>Emri i personit *</span><input required minLength={2} value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} placeholder="Emri dhe mbiemri" /></label>}
            <label><span>Projekti</span><select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value, projectMilestoneId: "", projectBillingType: event.target.value ? "INCLUDED" : "NON_BILLABLE", billable: false })}><option value="">Pa projekt</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.clientName ? ` · ${project.clientName}` : ""}</option>)}</select></label>
            {form.projectId && <label><span>Faza e projektit</span><select value={form.projectMilestoneId} onChange={(event) => setForm({ ...form, projectMilestoneId: event.target.value })}><option value="">Pa fazë</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.name}</option>)}</select></label>}
            {form.projectId && <label><span>Faturimi në projekt</span><select value={form.projectBillingType} onChange={(event) => { const value = event.target.value as ProjectTaskBillingType; setForm({ ...form, projectBillingType: value, billable: value === "EXTRA_BILLABLE" }); }}><option value="INCLUDED">E përfshirë në projekt</option><option value="EXTRA_BILLABLE">Shtesë me pagesë</option><option value="NON_BILLABLE">Pa pagesë</option></select></label>}
            <label className="fieldWide"><span>Titulli *</span><input required minLength={2} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label className="fieldWide"><span>Përshkrimi</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label><span>Prioriteti</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Statusi</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>{statusColumns.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span>Data e fillimit</span><input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label><span>Afati</span><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label><span>Orë të planifikuara</span><input type="number" min="0" step="0.25" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} /></label><label><span>Kosto e punës/orë (€)</span><input type="number" min="0" step="0.01" value={form.hourlyCostRate} onChange={(event) => setForm({ ...form, hourlyCostRate: event.target.value })} /></label>
            <div className="fieldWide labelPicker"><div className="labelPickerHeading"><span>Label / Kategoria e punës</span><Link href="/settings">Menaxho label-at te Settings</Link></div><div className="labelOptions">{labels.length ? labels.map((label) => <label key={label.id} className={form.labelIds.includes(label.id) ? "selected" : ""}><input type="checkbox" checked={form.labelIds.includes(label.id)} onChange={() => setForm((current) => ({ ...current, labelIds: current.labelIds.includes(label.id) ? current.labelIds.filter((id) => id !== label.id) : [...current.labelIds, label.id] }))} /><i style={{ backgroundColor: label.color }} />{label.name}</label>) : <span className="labelPickerEmpty">Krijo label-in e parë te Settings.</span>}</div></div>
          </div></section>
          <section className="billingFormSection"><div className="billingFormHeading"><div><h3>Faturimi</h3><p>{form.projectId ? "Faturimi menaxhohet nga projekti sipas klasifikimit të detyrës." : form.subjectType === "PERSON" ? "Për faturim, personi duhet të regjistrohet si klient." : "Përgatite punën për faturim pas përfundimit."}</p></div><label className="billingSwitch"><input type="checkbox" disabled={form.subjectType === "PERSON" || Boolean(form.projectId)} checked={form.billable} onChange={(event) => setForm({ ...form, billable: event.target.checked })} /><span>{form.projectId ? billingTypeLabels[form.projectBillingType] : form.billable ? "Faturueshme" : "Pa faturim"}</span></label></div>{form.billable && <div className="taskFormGrid"><label><span>Lloji</span><select value={form.billingType} onChange={(event) => setForm({ ...form, billingType: event.target.value as "FIXED" | "HOURLY" })}><option value="FIXED">Çmim fiks</option><option value="HOURLY">Me orë</option></select></label><label><span>Përshkrimi në faturë</span><input value={form.invoiceDescription} onChange={(event) => setForm({ ...form, invoiceDescription: event.target.value })} /></label><label><span>{form.billingType === "HOURLY" ? "Orët" : "Sasia"}</span><input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label><span>Çmimi për njësi (€)</span><input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} /></label><label><span>TVSH (%)</span><input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(event) => setForm({ ...form, vatRate: event.target.value })} /></label><label><span>Zbritja (%)</span><input type="number" min="0" max="100" step="0.01" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} /></label><div className="billingPreview fieldWide"><span>Totali i parashikuar</span><strong>{euro(formTotal)}</strong><small>Përfshirë TVSH dhe zbritje</small></div></div>}</section>
        </>}
        <div className="taskModalActions"><button type="button" className="secondaryButton" onClick={() => setOpen(false)}>Anulo</button><button type="submit" className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : editingTask ? "Ruaj ndryshimet" : "Krijo detyrën"}</button></div>
      </form>
    </div></div>}

    {completionTask && <div className="modalBackdrop" onMouseDown={() => !saving && setCompletionTask(null)}><div className="completionModal" onMouseDown={(event) => event.stopPropagation()}><div className="confirmIcon complete">✓</div><h2>Përfundo detyrën?</h2><strong>{completionTask.title}</strong><p>{completionTask.projectId ? "Faturimi i kësaj detyre menaxhohet nga projekti." : "Zgjidh çfarë duhet të ndodhë pas mbylljes së detyrës."}</p><div className="completionActions">{completionTask.projectId ? <button className="primaryButton" disabled={saving} onClick={() => void finishTask("NO_BILLING")}>Përfundo detyrën</button> : <>{completionTask.billable && completionTask.clientId && <><button className="primaryButton" disabled={saving} onClick={() => void finishTask("BILL_NOW")}>Përfundo dhe kalo për faturim</button><button className="secondaryButton" disabled={saving} onClick={() => void finishTask("BILL_LATER")}>Përfundo, faturo më vonë</button></>}<button className="secondaryButton" disabled={saving} onClick={() => void finishTask("NO_BILLING")}>Përfundo pa faturim</button></>}<button className="textButton" disabled={saving} onClick={() => setCompletionTask(null)}>Anulo</button></div></div></div>}
  </>;
}
