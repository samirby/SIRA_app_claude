"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { TaskManager } from "@/app/tasks/task-manager";
import { RecommendationsPanel } from "@/app/recommendations/recommendations-panel";

type ProjectStatus = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "COMPLETED";
type BillingType = "INCLUDED" | "EXTRA_BILLABLE" | "NON_BILLABLE";
type ProjectTab = "overview" | "tasks" | "activity" | "documents" | "summary" | "phases" | "notes" | "recommendations";
type MilestoneStatus = "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
type BlockerSeverity = "LOW" | "MEDIUM" | "HIGH";
interface Label { id: number; name: string; color: string; }
interface TimeEntry { id: number; workDate: string; startTime: string | null; endTime: string | null; minutes: number; note: string | null; createdAt: string; }
interface NoteEntry { id: number; note: string; createdAt: string; }
interface ProjectDocument { id: number; name: string; url: string | null; fileName: string | null; mimeType: string | null; fileSize: number | null; description: string | null; documentType: "DOCUMENT" | "DELIVERABLE"; approvalStatus: "NOT_REQUIRED" | "DRAFT" | "IN_REVIEW" | "APPROVED"; approvedAt: string | null; createdAt: string; }
interface ProjectUpdate { id: number; updateDate: string; updateType: "UPDATE" | "INFORMATION" | "DECISION" | "PROBLEM" | "CLIENT_REQUEST"; title: string; description: string; createdAt: string; }
interface ProjectMilestone { id: number; name: string; description: string | null; status: MilestoneStatus; startDate: string | null; dueDate: string | null; sortOrder: number; completedAt: string | null; createdAt: string; updatedAt: string; }
interface ProjectBlocker { id: number; title: string; description: string | null; severity: BlockerSeverity; status: "OPEN" | "RESOLVED"; dueDate: string | null; resolvedAt: string | null; createdAt: string; updatedAt: string; }
interface ProjectActivity { id: number; action: string; description: string; createdAt: string; }
interface ProjectWorkspace { documents: ProjectDocument[]; updates: ProjectUpdate[]; milestones: ProjectMilestone[]; blockers: ProjectBlocker[]; activity: ProjectActivity[]; }
interface Project {
  id: number; clientId: number | null; clientName: string | null; productId: number | null; productName: string | null;
  name: string; description: string | null; basePrice: number; vatRate: number; discountPercent: number;
  status: ProjectStatus; startDate: string | null; dueDate: string | null; billingStatus: "NOT_BILLABLE" | "NOT_READY" | "PENDING" | "DRAFTED" | "INVOICED";
  invoiceId: number | null; invoiceNumber: string | null; taskCount: number; completedTaskCount: number; spentMinutes: number; estimatedMinutes: number;
  costBudget: number; internalCostTotal: number; billableExtraCostTotal: number; extraTaskNet: number; billingNet: number; billingTax: number; billingTotal: number;
  profit: number; profitMargin: number;
}
interface Task {
  id: number; title: string; description: string | null; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: TaskStatus; dueDate: string | null; spentMinutes: number; projectBillingType: BillingType;
  projectMilestoneId: number | null; projectMilestoneName: string | null;
  unitPrice: number; labels: Label[]; timeEntries: TimeEntry[]; noteEntries: NoteEntry[];
}

const projectStatuses: Record<ProjectStatus, string> = { OPEN: "Në pritje", IN_PROGRESS: "Në punë", ON_HOLD: "Në pritje", COMPLETED: "Përfunduar", CANCELLED: "Anuluar" };
const taskStatuses: Array<{ value: TaskStatus; label: string }> = [{ value: "NEW", label: "E re" }, { value: "IN_PROGRESS", label: "Në punë" }, { value: "WAITING", label: "Në pritje" }, { value: "COMPLETED", label: "Përfunduar" }];
const priorityLabels = { LOW: "Ulët", NORMAL: "Normal", HIGH: "Lartë", URGENT: "Urgjent" } as const;
const projectTabs: Array<{ value: ProjectTab; label: string; icon: string }> = [
  { value: "overview", label: "Puna", icon: "✓" },
  { value: "documents", label: "Dokumentet", icon: "▤" },
  { value: "activity", label: "Detajet", icon: "◷" },
  { value: "summary", label: "Përmbledhja", icon: "▦" },
  { value: "phases", label: "Fazat", icon: "④" },
  { value: "notes", label: "Aktiviteti", icon: "●" },
  { value: "recommendations", label: "Rekomandime", icon: "★" },
];
const emptyTask = { title: "", description: "", priority: "NORMAL" as Task["priority"], dueDate: "", projectBillingType: "INCLUDED" as BillingType, unitPrice: "", vatRate: "20", labelIds: [] as number[] };
function euro(value: number) { return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value); }
function hours(minutes: number) { const value = minutes / 60; return `${Number.isInteger(value) ? value : value.toFixed(1)} orë`; }
function date(value: string | null) { if (!value) return "Pa afat"; const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; }
function fileSize(value: number | null) { if (!value) return ""; return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }

// Rrumbullak progresi (donut ring) — përdoret te shënuesit e fazave, mbushet me ngjyrë sipas % së
// detyrave të përfunduara në atë fazë (p.sh. 5 nga 10 detyra = 50% e rrethit).
function PhaseRing({ progress, size = 31, strokeWidth = 3, children }: { progress: number; size?: number; strokeWidth?: number; children: ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped === 100 ? "#199455" : "#18B8C1";
  return (
    <span className="phaseRing" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7edf3" strokeWidth={strokeWidth} />
        {clamped > 0 && <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <em>{children}</em>
    </span>
  );
}

export function ProjectDetail({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [workspace, setWorkspace] = useState<ProjectWorkspace>({ documents: [], updates: [], milestones: [], blockers: [], activity: [] });
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [documentForm, setDocumentForm] = useState<{ name: string; description: string; documentType: "DOCUMENT" | "DELIVERABLE"; file: File | null }>({ name: "", description: "", documentType: "DOCUMENT", file: null });
  const [updateForm, setUpdateForm] = useState({ updateDate: new Date().toISOString().slice(0, 10), updateType: "UPDATE" as ProjectUpdate["updateType"], title: "", description: "" });
  const [milestoneForm, setMilestoneForm] = useState({ name: "", description: "", status: "PLANNED" as MilestoneStatus, startDate: "", dueDate: "" });
  const [blockerForm, setBlockerForm] = useState({ title: "", description: "", severity: "MEDIUM" as BlockerSeverity, dueDate: "" });
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "OPEN" as ProjectStatus, startDate: "", dueDate: "", estimatedHours: "", costBudget: "0", basePrice: "0", vatRate: "20", discountPercent: "0" });
  const [taskOpen, setTaskOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(showLoader = false) {
    if (showLoader) setLoading(true); setError("");
    try {
      const responses = await Promise.all([
        fetch(`/api/v1/projects/${projectId}`, { cache: "no-store" }),
        fetch(`/api/v1/tasks?projectId=${projectId}`, { cache: "no-store" }),
        fetch("/api/v1/labels", { cache: "no-store" }),
        fetch(`/api/v1/projects/${projectId}/workspace`, { cache: "no-store" }),
      ]);
      const results = await Promise.all(responses.map((response) => response.json()));
      if (!responses[0].ok || !results[0].ok) throw new Error(results[0]?.error?.message || "Projekti nuk mund të ngarkohet.");
      setProject(results[0].data);
      if (responses[1].ok && results[1].ok) setTasks(results[1].data);
      if (responses[2].ok && results[2].ok) setLabels(results[2].data);
      if (responses[3].ok && results[3].ok) setWorkspace(results[3].data);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setLoading(false); }
  }
  // load is redefined every render but only reads projectId (already a dep); intentionally excluded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(true); }, [projectId]);
  useEffect(() => {
    if (!project || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const milestoneParam = params.get("milestone");
    if (milestoneParam) {
      const milestoneId = Number(milestoneParam);
      if (Number.isFinite(milestoneId)) { setActiveTab("overview"); selectMilestone(milestoneId); }
      params.delete("milestone");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    const target = window.location.hash;
    if (target === "#edit") {
      setEditForm({ name: project.name, description: project.description ?? "", status: project.status, startDate: project.startDate ?? "", dueDate: project.dueDate ?? "", estimatedHours: String(project.estimatedMinutes / 60), costBudget: String(project.costBudget), basePrice: String(project.basePrice), vatRate: String(project.vatRate), discountPercent: String(project.discountPercent) });
      setEditOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    if (target === "#complete") {
      setFinishOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    if (target === "#finance") {
      setActiveTab("overview");
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    const requestedTab = target.slice(1) as ProjectTab;
    if (projectTabs.some((tab) => tab.value === requestedTab)) {
      setActiveTab(requestedTab);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [project]);

  function openEdit() {
    if (!project) return;
    setEditForm({ name: project.name, description: project.description ?? "", status: project.status, startDate: project.startDate ?? "", dueDate: project.dueDate ?? "", estimatedHours: String(project.estimatedMinutes / 60), costBudget: String(project.costBudget), basePrice: String(project.basePrice), vatRate: String(project.vatRate), discountPercent: String(project.discountPercent) });
    setEditOpen(true); setError("");
  }

  function selectMilestone(milestoneId: number) {
    setSelectedMilestoneId(milestoneId);
    window.setTimeout(() => document.getElementById("phase-kanban")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  async function editProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: editForm.name, description: editForm.description || null, status: editForm.status,
        startDate: editForm.startDate || null, dueDate: editForm.dueDate || null,
        estimatedMinutes: Math.max(0, Math.round((Number(editForm.estimatedHours) || 0) * 60)),
        costBudget: Number(editForm.costBudget) || 0,
        basePrice: Number(editForm.basePrice) || 0, vatRate: Number(editForm.vatRate) || 0,
        discountPercent: Number(editForm.discountPercent) || 0,
      }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Projekti nuk mund të ruhet.");
      setEditOpen(false); setMessage("Projekti u përditësua."); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!project?.clientId) return; setSaving(true); setError(""); setMessage("");
    try {
      const isExtra = taskForm.projectBillingType === "EXTRA_BILLABLE";
      const response = await fetch("/api/v1/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        subjectType: "CLIENT", clientId: project.clientId, personName: null, projectId: project.id, projectName: project.name,
        projectBillingType: taskForm.projectBillingType, title: taskForm.title, description: taskForm.description || null,
        assigneeName: null, priority: taskForm.priority, status: "NEW", startDate: project.startDate,
        dueDate: taskForm.dueDate || project.dueDate, estimatedMinutes: 0, spentMinutes: 0, notes: null,
        billable: isExtra, billingType: "FIXED", invoiceDescription: taskForm.title, quantity: 1,
        unitPrice: isExtra ? Number(taskForm.unitPrice) || 0 : 0, hourlyCostRate: 0,
        vatRate: Number(taskForm.vatRate) || project.vatRate, discountPercent: 0, labelIds: taskForm.labelIds,
      }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Detyra nuk mund të krijohet.");
      setTaskOpen(false); setTaskForm(emptyTask); setMessage("Detyra u shtua në projekt."); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function billingAction(action: "DRAFT" | "QUEUE" | "NO_BILLING") {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/billing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Projekti nuk mund të përfundohet.");
      setFinishOpen(false); setMessage(action === "DRAFT" ? "Projekti u përfundua dhe draft-fatura u krijua." : action === "QUEUE" ? "Projekti u përfundua dhe pret faturim." : "Projekti u përfundua pa faturim.");
      await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (!documentForm.file) throw new Error("Zgjidh dokumentin që dëshiron ta ngarkosh.");
      const formData = new FormData();
      formData.set("name", documentForm.name);
      formData.set("description", documentForm.description);
      formData.set("documentType", documentForm.documentType);
      formData.set("file", documentForm.file);
      const response = await fetch(`/api/v1/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Dokumenti nuk mund të ruhet.");
      setWorkspace(result.data); setDocumentForm({ name: "", description: "", documentType: "DOCUMENT", file: null }); setMessage("Dokumenti u ngarkua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function deleteDocument(documentId: number) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Dokumenti nuk mund të largohet.");
      setWorkspace(result.data); setMessage("Dokumenti u largua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function addUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/updates`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Përditësimi nuk mund të ruhet.");
      setWorkspace(result.data);
      setUpdateForm({ updateDate: new Date().toISOString().slice(0, 10), updateType: "UPDATE", title: "", description: "" });
      setMessage("Përditësimi i projektit u ruajt.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function deleteUpdate(updateId: number) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/updates/${updateId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Përditësimi nuk mund të largohet.");
      setWorkspace(result.data); setMessage("Përditësimi u largua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function addMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          ...milestoneForm, description: milestoneForm.description || null,
          startDate: milestoneForm.startDate || null, dueDate: milestoneForm.dueDate || null,
          sortOrder: workspace.milestones.length,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Faza nuk mund të ruhet.");
      setWorkspace(result.data); setMilestoneForm({ name: "", description: "", status: "PLANNED", startDate: "", dueDate: "" });
      setMessage("Faza e projektit u shtua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function updateMilestone(milestoneId: number, payload: Partial<ProjectMilestone>) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Faza nuk mund të përditësohet.");
      setWorkspace(result.data); setMessage("Statusi i fazës u përditësua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function deleteMilestone(milestoneId: number) {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Faza nuk mund të largohet.");
      setWorkspace(result.data); setMessage("Faza u largua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function addBlocker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/blockers`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          ...blockerForm, description: blockerForm.description || null, dueDate: blockerForm.dueDate || null, status: "OPEN",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Pengesa nuk mund të ruhet.");
      setWorkspace(result.data); setBlockerForm({ title: "", description: "", severity: "MEDIUM", dueDate: "" });
      setMessage("Pengesa e projektit u shtua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function updateBlocker(blockerId: number, status: ProjectBlocker["status"]) {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/blockers/${blockerId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Pengesa nuk mund të përditësohet.");
      setWorkspace(result.data); setMessage(status === "RESOLVED" ? "Pengesa u zgjidh." : "Pengesa u rihap.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function deleteBlocker(blockerId: number) {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/blockers/${blockerId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Pengesa nuk mund të largohet.");
      setWorkspace(result.data); setMessage("Pengesa u largua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  async function updateDocumentApproval(documentId: number, approvalStatus: ProjectDocument["approvalStatus"]) {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvalStatus }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Statusi nuk mund të ndryshohet.");
      setWorkspace(result.data); setMessage("Statusi i rezultatit u përditësua.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Gabim i panjohur."); }
    finally { setSaving(false); }
  }

  const openTasks = tasks.filter((task) => task.status !== "COMPLETED").length;
  const milestoneStats = new Map(workspace.milestones.map((milestone) => {
    const phaseTasks = tasks.filter((task) => task.projectMilestoneId === milestone.id);
    const completed = phaseTasks.filter((task) => task.status === "COMPLETED").length;
    return [milestone.id, { total: phaseTasks.length, completed, progress: phaseTasks.length ? Math.round(completed / phaseTasks.length * 100) : (milestone.status === "COMPLETED" ? 100 : 0) }];
  }));
  // Progresi total i projektit: çdo fazë vlen njësoj (100/numri i fazave — 25% secila me 4 fazat
  // fikse), jo i peshuar sipas numrit të detyrave brenda saj. Kështu një fazë me 2 detyra ndikon
  // njësoj sa një fazë me 20 detyra.
  const progress = workspace.milestones.length
    ? Math.round(workspace.milestones.reduce((sum, milestone) => sum + (milestoneStats.get(milestone.id)?.progress ?? 0), 0) / workspace.milestones.length)
    : (tasks.length ? Math.round(tasks.filter((task) => task.status === "COMPLETED").length / tasks.length * 100) : 0);
  const phasedTasks = tasks.filter((task) => task.projectMilestoneId !== null);
  const milestoneProgress = phasedTasks.length
    ? Math.round(phasedTasks.filter((task) => task.status === "COMPLETED").length / phasedTasks.length * 100)
    : (workspace.milestones.length ? Math.round(workspace.milestones.filter((item) => item.status === "COMPLETED").length / workspace.milestones.length * 100) : 0);
  const completedMilestones = workspace.milestones.filter((milestone) => milestoneStats.get(milestone.id)?.progress === 100).length;
  const activeMilestone = workspace.milestones.find((milestone) => milestone.status === "IN_PROGRESS" || milestone.status === "BLOCKED")
    ?? workspace.milestones.find((milestone) => milestone.status !== "COMPLETED")
    ?? workspace.milestones.at(-1);
  const visibleMilestoneId = selectedMilestoneId ?? activeMilestone?.id ?? null;
  const timeProgress = project?.estimatedMinutes ? Math.round((project.spentMinutes / project.estimatedMinutes) * 100) : 0;
  const openBlockers = workspace.blockers.filter((item) => item.status === "OPEN");
  const hasBilling = Boolean(project && project.billingNet > 0);
  const billingLabel = project?.billingStatus === "PENDING" ? "Pret faturim" : project?.billingStatus === "DRAFTED" ? "Në draft faturë" : project?.billingStatus === "INVOICED" ? "E faturuar" : project?.billingStatus === "NOT_BILLABLE" ? "Pa faturim" : "Në përgatitje";
  const taskColumns = useMemo(() => taskStatuses.map((column) => ({ ...column, tasks: tasks.filter((task) => task.status === column.value) })), [tasks]);
  const activityItems = useMemo(() => [
    ...workspace.updates.map((item) => ({ key: `update-${item.id}`, title: item.title, description: item.description, createdAt: item.createdAt, updateId: item.id })),
    ...workspace.activity.map((item) => ({ key: `activity-${item.id}`, title: item.description, description: "Ndryshim automatik", createdAt: item.createdAt, updateId: null })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [workspace.activity, workspace.updates]);
  if (loading) return <div className="taskDetailState">Duke ngarkuar projektin...</div>;
  if (!project) return <div className="taskDetailState errorState"><strong>Projekti nuk u hap</strong><span>{error}</span><Link href="/projects">Kthehu te projektet</Link></div>;

  return <>
    {message && <div className="clientAlert success">{message}</div>}{error && <div className="clientAlert error">{error}</div>}
    <section className="projectDetailHero"><div><div className="projectHeroBadges"><Link className="taskBackButton" href="/projects">←</Link><span className={`projectStatus status-${project.status.toLowerCase()}`}>{projectStatuses[project.status]}</span>{project.productName && <span className="projectPackageBadge">{project.productName}</span>}</div><h2>{project.name}</h2><p>{project.description || "Pa përshkrim"}</p></div><div className="projectHeroActions"><button className="secondaryButton" onClick={openEdit}>✎ Edito projektin</button>{!["COMPLETED", "CANCELLED"].includes(project.status) && <button className="primaryButton" onClick={() => setFinishOpen(true)}>✓ Përfundo projektin</button>}{project.invoiceId && <Link className="primaryButton" href={`/invoices#invoice-${project.invoiceId}`}>{project.invoiceNumber || "Hap faturën"}</Link>}</div></section>
    <section className="projectDetailMetrics"><article><small>Klienti</small><strong>{project.clientName}</strong></article><article><small>Paketa</small><strong>{project.productName || "Projekt i personalizuar"}</strong></article><article><small>Periudha</small><strong>{date(project.startDate)} → {date(project.dueDate)}</strong></article><article><small>Progresi</small><strong>{progress}%</strong><span>{project.completedTaskCount}/{project.taskCount} detyra</span></article><article><small>Koha</small><strong>{hours(project.spentMinutes)}</strong></article></section>
    <nav className="projectDetailTabs" aria-label="Seksionet e projektit">{projectTabs.map((tab) => <button key={tab.value} className={activeTab === tab.value ? "active" : ""} onClick={() => setActiveTab(tab.value)}><span>{tab.icon}</span>{tab.label}{tab.value === "tasks" && <small>{tasks.length}</small>}{tab.value === "documents" && <small>{workspace.documents.length}</small>}</button>)}</nav>

    {activeTab === "overview" && <>
      <section className="projectMockupDashboard" aria-label="Përmbledhja operative e projektit">
        <div className="projectMockupCards">
          <article><span>PROGRESI</span><strong>{progress}%</strong><div className="projectMockupBar"><i style={{ width: `${progress}%` }} /></div><small>{project.completedTaskCount}/{project.taskCount} detyra të përfunduara</small></article>
          <article><span>FAZA AKTUALE</span><strong className="accent">{activeMilestone?.name || "Pa fazë"}</strong><small>{activeMilestone ? `${milestoneStats.get(activeMilestone.id)?.progress ?? 0}% e përfunduar` : "Shto fazën e parë"}</small></article>
          <article><span>AFATI</span><strong>{date(project.dueDate)}</strong><small>{project.startDate ? `Filluar më ${date(project.startDate)}` : "Pa datë fillimi"}</small></article>
          <article><span>BUXHETI</span><strong>{euro(project.basePrice)}</strong><small>{hours(project.spentMinutes)} të regjistruara</small></article>
        </div>
        <article className="projectMockupPhases">
          <header><div><h3>Fazat e projektit</h3><p>Progresi llogaritet nga detyrat e lidhura me secilën fazë.</p></div><strong>{completedMilestones}/{workspace.milestones.length}</strong></header>
          {workspace.milestones.length ? <div className="projectMockupPhaseTrack">{workspace.milestones.map((milestone, index) => { const stats = milestoneStats.get(milestone.id)!; return <button key={milestone.id} className={milestone.id === visibleMilestoneId ? "active" : stats.progress === 100 ? "complete" : ""} onClick={() => selectMilestone(milestone.id)}><PhaseRing progress={stats.progress}>{stats.progress === 100 ? "✓" : index + 1}</PhaseRing><strong>{milestone.name}</strong><span>{stats.progress}%</span></button>; })}</div> : <p className="projectSimpleEmpty">Nuk ka faza. Krijoji më poshtë.</p>}
        </article>
        {/* Kanban-i i plotë i projektit (jo i filtruar sipas fazës) — meqë çdo status Kanban ËSHTË
            vetë faza (shih v0.14.7), filtrimi te një fazë e vetme e fshihte detyrën sapo ndryshonte
            statusi (dilte nga faza e filtruar). Klikimi i një faze më sipër vetëm zbret te ky Kanban. */}
        {project.clientId && <section id="phase-kanban" className="projectPhaseKanban"><TaskManager embedded projectContext={{ id: project.id, clientId: project.clientId, name: project.name, clientName: project.clientName, milestones: workspace.milestones.map(({ id, name, status }) => ({ id, name, status })) }} onTasksChanged={() => void load()} /></section>}
        <article className="projectMockupActivity"><header><div><h3>Aktiviteti i fundit</h3><p>Ndryshimet më të reja në projekt.</p></div><button onClick={() => setActiveTab("activity")}>Shiko aktivitetin →</button></header>{activityItems.slice(0, 3).map((entry) => <div key={entry.key}><i /><span><strong>{entry.title}</strong><small>{new Date(entry.createdAt).toLocaleString("de-AT")}</small></span></div>)}</article>
      </section>

    </>}

    {activeTab === "summary" && <section className="projectAdvancedOverview projectSummaryTab">
        <article className="projectOverviewMain">
          <header><div><small>PËRMBLEDHJA</small><h3>{project.name}</h3></div><span className={`projectStatus status-${project.status.toLowerCase()}`}>{projectStatuses[project.status]}</span></header>
          <p>{project.description || "Ky projekt nuk ka ende përshkrim."}</p>
          <div className="projectOverviewProgress"><div><strong>{progress}%</strong><span>Progresi i detyrave</span></div><div><i style={{ width: `${progress}%` }} /></div></div>
          <div className="projectPlanningGrid">
            <article><span>Koha e planifikuar</span><strong>{hours(project.estimatedMinutes)}</strong></article>
            <article><span>Koha aktuale</span><strong>{hours(project.spentMinutes)}</strong></article>
            <article><span>Fazat</span><strong>{milestoneProgress}%</strong></article>
            <article className={timeProgress > 100 ? "overBudget" : ""}><span>Përdorimi i kohës</span><strong>{project.estimatedMinutes ? `${timeProgress}%` : "Pa plan"}</strong></article>
          </div>
          {openBlockers.length > 0 && <div className="projectBlockerNotice"><strong>⚠ Projekti është në pritje</strong><span>{openBlockers.map((item) => item.title).join(" · ")}</span></div>}
          <div className="projectTaskStatusSummary">{taskColumns.map((column) => <button key={column.value} onClick={() => setActiveTab("tasks")}><strong>{column.tasks.length}</strong><span>{column.label}</span></button>)}</div>
        </article>
        <aside>
          <article className="projectFinanceCard projectOverviewFinanceCard">
            <header><div><h3>Financat</h3><p>Kostoja, fitimi dhe faturimi.</p></div><span className={`billingBadge ${project.billingStatus.toLowerCase()}`}>{billingLabel}</span></header>
            <dl>
              <div><dt>Çmimi bazë</dt><dd>{euro(project.basePrice)}</dd></div>
              <div><dt>Shtesa me pagesë</dt><dd>{euro(project.extraTaskNet + project.billableExtraCostTotal)}</dd></div>
              <div className="projectInternalCost"><dt>Kosto reale</dt><dd>{euro(project.internalCostTotal)}</dd></div>
              <div><dt>Buxheti i kostos</dt><dd>{euro(project.costBudget)}</dd></div>
              <div className={project.profit < 0 ? "projectProfit negative" : "projectProfit positive"}><dt>Fitimi</dt><dd>{euro(project.profit)}</dd></div>
              <div><dt>Marzha</dt><dd>{project.billingNet ? `${project.profitMargin.toFixed(1)}%` : "—"}</dd></div>
            </dl>
            <footer><span>Totali për faturim</span><strong>{euro(project.billingTotal)}</strong></footer>
            {project.status === "COMPLETED" && project.billingStatus === "PENDING" && <button className="primaryButton projectBillingButton" disabled={!hasBilling || saving} onClick={() => void billingAction("DRAFT")}>Krijo draft faturë</button>}
            {project.invoiceId && <Link className="primaryButton projectBillingButton" href={`/invoices#invoice-${project.invoiceId}`}>Hap faturën</Link>}
          </article>
          <article className="projectOverviewQuickCard"><small>VEPRIME</small><button className="primaryButton" onClick={() => setActiveTab("tasks")}>Hap detyrat</button><button className="secondaryButton" onClick={() => setActiveTab("documents")}>Hap dokumentet</button></article>
        </aside>
    </section>}

    {activeTab === "phases" && <section className="projectSimpleWorkspace projectSingleWorkspace projectTabPanel">
        <article className="projectSimplePhases">
          <header><div><h3>Fazat</h3><p>Hapat kryesorë dhe detyrat që kryhen në secilën fazë.</p></div><strong>{completedMilestones}/{workspace.milestones.length}</strong></header>
          <form className="projectSimplePhaseForm" onSubmit={addMilestone}>
            <input required minLength={2} value={milestoneForm.name} onChange={(event) => setMilestoneForm({ ...milestoneForm, name: event.target.value })} placeholder="Emri i fazës" />
            <input type="date" value={milestoneForm.dueDate} onChange={(event) => setMilestoneForm({ ...milestoneForm, dueDate: event.target.value })} />
            <select value={milestoneForm.status} onChange={(event) => setMilestoneForm({ ...milestoneForm, status: event.target.value as MilestoneStatus })}><option value="PLANNED">Në pritje</option><option value="IN_PROGRESS">Në punë</option><option value="COMPLETED">Përfunduar</option></select>
            <button className="primaryButton" disabled={saving}>+ Shto</button>
          </form>
          {workspace.milestones.length ? <div className="projectSimplePhaseList">{workspace.milestones.map((milestone, index) => { const stats = milestoneStats.get(milestone.id)!; return <article key={milestone.id}><PhaseRing progress={stats.progress} size={28} strokeWidth={3}>{stats.progress === 100 ? "✓" : index + 1}</PhaseRing><div className="projectPhaseSummary"><strong>{milestone.name}</strong><span>{date(milestone.dueDate)} · {stats.completed}/{stats.total} detyra · {stats.progress}%</span><div className="projectPhaseProgress"><i style={{ width: `${stats.progress}%` }} /></div></div><select value={milestone.status} disabled={saving} onChange={(event) => void updateMilestone(milestone.id, { status: event.target.value as MilestoneStatus })}><option value="PLANNED">Në pritje</option><option value="IN_PROGRESS">Në punë</option><option value="BLOCKED">E bllokuar</option><option value="COMPLETED">Përfunduar</option></select><button className="cleanDeleteButton" disabled={saving} onClick={() => void deleteMilestone(milestone.id)} aria-label={`Largo ${milestone.name}`}>×</button></article>; })}</div> : <p className="projectSimpleEmpty">Nuk ka faza. Shto fazën e parë më sipër.</p>}
          <div className="projectWaitingReason">
            <form onSubmit={addBlocker}><input required minLength={2} value={blockerForm.title} onChange={(event) => setBlockerForm({ ...blockerForm, title: event.target.value })} placeholder="Projekti është në pritje sepse…" /><button className="secondaryButton" disabled={saving}>Shëno</button></form>
            {openBlockers.map((blocker) => <div key={blocker.id}><span>⚠ {blocker.title}</span><button onClick={() => void updateBlocker(blocker.id, "RESOLVED")}>✓ Zgjidhur</button><button className="cleanDeleteButton" onClick={() => void deleteBlocker(blocker.id)} aria-label={`Largo ${blocker.title}`}>×</button></div>)}
          </div>
        </article>
    </section>}

    {activeTab === "notes" && <section className="projectSimpleWorkspace projectSingleWorkspace projectTabPanel">
        <article className="projectSimpleActivity">
          <header><div><h3>Aktiviteti</h3><p>Shënimet dhe ndryshimet e projektit.</p></div><strong>{activityItems.length}</strong></header>
          <form onSubmit={addUpdate}><input required minLength={2} value={updateForm.title} onChange={(event) => setUpdateForm({ ...updateForm, title: event.target.value })} placeholder="Titulli i shënimit" /><textarea required minLength={2} rows={2} value={updateForm.description} onChange={(event) => setUpdateForm({ ...updateForm, description: event.target.value })} placeholder="Çfarë u realizua?" /><button className="primaryButton" disabled={saving}>+ Ruaj</button></form>
          {activityItems.length ? <div className="projectSimpleActivityList">{activityItems.slice(0, 12).map((entry) => <article key={entry.key}><i /><div><strong>{entry.title}</strong><p>{entry.description}</p><time>{new Date(entry.createdAt).toLocaleString("de-AT")}</time></div>{entry.updateId && <button className="cleanDeleteButton" disabled={saving} onClick={() => void deleteUpdate(entry.updateId!)} aria-label={`Largo ${entry.title}`}>×</button>}</article>)}</div> : <p className="projectSimpleEmpty">Aktivitetet do të shfaqen këtu.</p>}
        </article>
    </section>}

    {activeTab === "tasks" && <section id="tasks" className="projectEmbeddedTasks projectTabPanel">{project.clientId ? <TaskManager embedded projectContext={{ id: project.id, clientId: project.clientId, name: project.name, clientName: project.clientName, milestones: workspace.milestones.map(({ id, name, status }) => ({ id, name, status })) }} onTasksChanged={() => void load()} /> : <div className="projectEmptyPanel"><strong>Projekti nuk ka klient</strong><p>Lidhe projektin me një klient para se të shtosh detyra.</p></div>}</section>}

    {activeTab === "recommendations" && <section className="projectTabPanel">{project.clientId ? <RecommendationsPanel embedded clientId={project.clientId} projectId={project.id} projectName={project.name} /> : <div className="projectEmptyPanel"><strong>Projekti nuk ka klient</strong><p>Lidhe projektin me një klient para se të shtosh rekomandime.</p></div>}</section>}

    {activeTab === "activity" && <section className="projectActivityPanel projectTabPanel"><header><div><h3>Aktiviteti i projektit</h3><p>Shënime, vendime, kërkesa të klientit dhe ndryshime automatike.</p></div><strong>{activityItems.length}</strong></header><form className="projectUpdateForm" onSubmit={addUpdate}><label><span>Data</span><input type="date" required value={updateForm.updateDate} onChange={(event) => setUpdateForm({ ...updateForm, updateDate: event.target.value })} /></label><label><span>Lloji</span><select value={updateForm.updateType} onChange={(event) => setUpdateForm({ ...updateForm, updateType: event.target.value as ProjectUpdate["updateType"] })}><option value="UPDATE">Përditësim</option><option value="INFORMATION">Informacion</option><option value="DECISION">Vendim</option><option value="PROBLEM">Problem</option><option value="CLIENT_REQUEST">Kërkesë e klientit</option></select></label><label className="fieldWide"><span>Titulli</span><input required minLength={2} value={updateForm.title} onChange={(event) => setUpdateForm({ ...updateForm, title: event.target.value })} placeholder="Çfarë ndodhi?" /></label><label className="fieldWide"><span>Përshkrimi</span><textarea required minLength={2} value={updateForm.description} onChange={(event) => setUpdateForm({ ...updateForm, description: event.target.value })} /></label><button className="primaryButton" disabled={saving}>+ Ruaj aktivitetin</button></form><div className="projectActivityFullList">{activityItems.map((entry) => <article key={entry.key}><i /><div><strong>{entry.title}</strong><p>{entry.description}</p><time>{new Date(entry.createdAt).toLocaleString("de-AT")}</time></div>{entry.updateId && <button className="cleanDeleteButton" disabled={saving} onClick={() => void deleteUpdate(entry.updateId!)}>×</button>}</article>)}</div></section>}


    {activeTab === "documents" && <section className="projectDocumentsPanel projectTabPanel">
      <header><div><h3>Dokumentet</h3><p>Ngarko oferta, kontrata, dizajne ose skedarë të tjerë të projektit.</p></div><strong>{workspace.documents.length}</strong></header>
      <form className="projectDocumentForm" onSubmit={addDocument}>
        <label><span>Emri *</span><input required minLength={2} value={documentForm.name} onChange={(event) => setDocumentForm({ ...documentForm, name: event.target.value })} placeholder="P.sh. Oferta e projektit" /></label>
        <label><span>Lloji</span><select value={documentForm.documentType} onChange={(event) => setDocumentForm({ ...documentForm, documentType: event.target.value as ProjectDocument["documentType"] })}><option value="DOCUMENT">Dokument</option><option value="DELIVERABLE">Rezultat për aprovim</option></select></label>
        <label><span>Dokumenti * (maks. 10 MB)</span><input required type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png,.webp" onChange={(event) => setDocumentForm({ ...documentForm, file: event.target.files?.[0] ?? null })} /></label>
        <label className="fieldWide"><span>Përshkrimi</span><input value={documentForm.description} onChange={(event) => setDocumentForm({ ...documentForm, description: event.target.value })} placeholder="Shënim opsional" /></label>
        <button className="primaryButton" disabled={saving}>{saving ? "Duke ngarkuar..." : "+ Ngarko dokument"}</button>
      </form>
      {workspace.documents.length ? <div className="projectDocumentList">{workspace.documents.map((document) => <article key={document.id} className={document.documentType === "DELIVERABLE" ? "projectDeliverable" : ""}><div className="projectDocumentIcon">{document.documentType === "DELIVERABLE" ? "◇" : "▤"}</div><div>{document.fileName ? <a href={`/api/v1/projects/${projectId}/documents/${document.id}`}>{document.name}</a> : document.url ? <a href={document.url} target="_blank" rel="noreferrer">{document.name}</a> : <strong>{document.name}</strong>}<p>{document.description || document.fileName || "Pa përshkrim"}{document.fileSize ? ` · ${fileSize(document.fileSize)}` : ""}</p><time>{new Date(document.createdAt).toLocaleString("de-AT")}</time></div>{document.documentType === "DELIVERABLE" && <select className={`deliverableStatus status-${document.approvalStatus.toLowerCase()}`} aria-label={`Statusi i ${document.name}`} value={document.approvalStatus} disabled={saving} onChange={(event) => void updateDocumentApproval(document.id, event.target.value as ProjectDocument["approvalStatus"])}><option value="DRAFT">Draft</option><option value="IN_REVIEW">Në shqyrtim</option><option value="APPROVED">Aprovuar</option></select>}<button className="projectDocumentDelete" disabled={saving} onClick={() => void deleteDocument(document.id)} title="Largo dokumentin">×</button></article>)}</div> : <div className="projectEmptyPanel"><strong>Nuk ka dokumente</strong><p>Ngarko dokumentin e parë të këtij projekti.</p></div>}
    </section>}

    {taskOpen && <div className="modalBackdrop" onMouseDown={() => !saving && setTaskOpen(false)}><div className="clientModal projectTaskModal" onMouseDown={(event) => event.stopPropagation()}><div className="modalHeader"><div><span>DETYRË E PROJEKTIT</span><h2>Shto detyrë</h2><p>Klienti dhe projekti plotësohen automatikisht.</p></div><button type="button" className="modalClose" onClick={() => setTaskOpen(false)}>×</button></div><form className="projectTaskForm" onSubmit={createTask}><label className="fieldWide"><span>Titulli *</span><input required minLength={2} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label><label className="fieldWide"><span>Përshkrimi</span><textarea rows={3} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} /></label><label><span>Prioriteti</span><select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Task["priority"] })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Afati</span><input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /></label><label><span>Lloji i faturimit</span><select value={taskForm.projectBillingType} onChange={(event) => setTaskForm({ ...taskForm, projectBillingType: event.target.value as BillingType })}><option value="INCLUDED">E përfshirë në projekt</option><option value="EXTRA_BILLABLE">Shtesë me pagesë</option><option value="NON_BILLABLE">Pa pagesë</option></select></label>{taskForm.projectBillingType === "EXTRA_BILLABLE" && <><label><span>Çmimi (€)</span><input required type="number" min="0.01" step="0.01" value={taskForm.unitPrice} onChange={(event) => setTaskForm({ ...taskForm, unitPrice: event.target.value })} /></label><label><span>TVSH (%)</span><input type="number" min="0" max="100" step="0.01" value={taskForm.vatRate} onChange={(event) => setTaskForm({ ...taskForm, vatRate: event.target.value })} /></label></>}<div className="fieldWide labelPicker"><div className="labelPickerHeading"><span>Labels</span><Link href="/settings">Menaxho te Settings</Link></div><div className="labelOptions">{labels.map((label) => <label key={label.id} className={taskForm.labelIds.includes(label.id) ? "selected" : ""}><input type="checkbox" checked={taskForm.labelIds.includes(label.id)} onChange={() => setTaskForm((current) => ({ ...current, labelIds: current.labelIds.includes(label.id) ? current.labelIds.filter((id) => id !== label.id) : [...current.labelIds, label.id] }))} /><i style={{ background: label.color }} />{label.name}</label>)}</div></div><div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setTaskOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>{saving ? "Duke ruajtur..." : "Ruaj detyrën"}</button></div></form></div></div>}

    {editOpen && <div className="modalBackdrop" onMouseDown={() => !saving && setEditOpen(false)}><div className="clientModal projectEditModal" onMouseDown={(event) => event.stopPropagation()}><div className="modalHeader"><div><span>EDITO PROJEKTIN</span><h2>{project.name}</h2><p>Çmimi i paketës ruhet vetëm në këtë projekt.</p></div><button type="button" className="modalClose" onClick={() => setEditOpen(false)}>×</button></div><form className="projectCreateForm" onSubmit={editProject}><label className="fieldWide"><span>Emri *</span><input required minLength={2} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label><label className="fieldWide"><span>Përshkrimi</span><textarea rows={3} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></label><label><span>Statusi</span><select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as ProjectStatus })}>{Object.entries(projectStatuses).filter(([value]) => value !== "COMPLETED" || project.status === "COMPLETED").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Data e fillimit</span><input type="date" value={editForm.startDate} onChange={(event) => setEditForm({ ...editForm, startDate: event.target.value })} /></label><label><span>Afati</span><input type="date" value={editForm.dueDate} onChange={(event) => setEditForm({ ...editForm, dueDate: event.target.value })} /></label><label><span>Orë të planifikuara</span><input type="number" min="0" step="0.5" value={editForm.estimatedHours} onChange={(event) => setEditForm({ ...editForm, estimatedHours: event.target.value })} /></label><label><span>Buxheti i kostos (€)</span><input type="number" min="0" step="0.01" value={editForm.costBudget} onChange={(event) => setEditForm({ ...editForm, costBudget: event.target.value })} /></label><label><span>Çmimi bazë (€)</span><input type="number" min="0" step="0.01" value={editForm.basePrice} onChange={(event) => setEditForm({ ...editForm, basePrice: event.target.value })} /></label><label><span>TVSH (%)</span><input type="number" min="0" max="100" step="0.01" value={editForm.vatRate} onChange={(event) => setEditForm({ ...editForm, vatRate: event.target.value })} /></label><label><span>Zbritja (%)</span><input type="number" min="0" max="100" step="0.01" value={editForm.discountPercent} onChange={(event) => setEditForm({ ...editForm, discountPercent: event.target.value })} /></label><div className="modalActions"><button type="button" className="secondaryButton" onClick={() => setEditOpen(false)}>Anulo</button><button className="primaryButton" disabled={saving}>Ruaj ndryshimet</button></div></form></div></div>}

    {finishOpen && <div className="modalBackdrop" onMouseDown={() => !saving && setFinishOpen(false)}><div className="completionModal" onMouseDown={(event) => event.stopPropagation()}><div className={`confirmIcon ${openTasks ? "archive" : "complete"}`}>{openTasks ? "!" : "✓"}</div><h2>Përfundo projektin?</h2><strong>{project.name}</strong>{openTasks ? <p>Projekti ka ende <strong>{openTasks}</strong> detyra të hapura. Përfundoji para mbylljes së projektit.</p> : <p>Zgjidh çfarë duhet të ndodhë me faturimin.</p>}<div className="completionActions">{openTasks ? <button className="primaryButton" onClick={() => setFinishOpen(false)}>Kthehu te detyrat</button> : <><button className="primaryButton" disabled={!hasBilling || saving} onClick={() => void billingAction("DRAFT")}>Përfundo dhe krijo draft-faturë</button><button className="secondaryButton" disabled={!hasBilling || saving} onClick={() => void billingAction("QUEUE")}>Përfundo, faturo më vonë</button><button className="secondaryButton" disabled={saving} onClick={() => void billingAction("NO_BILLING")}>Përfundo pa faturim</button></>}<button className="textButton" onClick={() => setFinishOpen(false)}>Anulo</button></div></div></div>}
  </>;
}
