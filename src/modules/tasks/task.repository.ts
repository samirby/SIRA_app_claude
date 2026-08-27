import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type {
  Task,
  TaskBillingStatus,
  TaskFilters,
  TaskExtraCost,
  TaskExtraCostInput,
  TaskHistoryEntry,
  TaskInput,
  TaskLabel,
  TaskNoteEntry,
  TaskPriority,
  ProjectTaskBillingType,
  TaskStatus,
  TaskSubtask,
  TaskSubjectType,
  TaskTimeEntry,
} from "./task.types";

type TaskRow = RowDataPacket & {
  id: number;
  subject_type: TaskSubjectType;
  client_id: number | null;
  client_name: string | null;
  person_name: string | null;
  invoice_id: number | null;
  invoice_number: string | null;
  project_id: number | null;
  project_name: string | null;
  project_milestone_id: number | null;
  project_milestone_name: string | null;
  project_billing_type: ProjectTaskBillingType;
  title: string;
  description: string | null;
  assignee_name: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | Date | null;
  due_date: string | Date | null;
  estimated_minutes: number;
  spent_minutes: number;
  notes: string | null;
  billable: number | boolean;
  billing_type: "FIXED" | "HOURLY";
  invoice_description: string | null;
  quantity: number;
  unit_price: number;
  hourly_cost_rate: number;
  vat_rate: number;
  discount_percent: number;
  billing_status: TaskBillingStatus;
  completed_at: Date | null;
  invoice_queued_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type SubtaskRow = RowDataPacket & {
  id: number;
  task_id: number;
  title: string;
  is_completed: number | boolean;
};

type HistoryRow = RowDataPacket & {
  id: number;
  action: string;
  details: string | Record<string, unknown> | null;
  created_at: Date;
};

type TimeRow = RowDataPacket & {
  id: number;
  task_id: number;
  work_date: string | Date;
  start_time: string | null;
  end_time: string | null;
  minutes: number;
  note: string | null;
  created_at: Date;
};

type NoteRow = RowDataPacket & {
  id: number;
  task_id: number;
  note: string;
  created_at: Date;
};

type ExtraCostRow = RowDataPacket & {
  id: number;
  task_id: number;
  description: string;
  amount: number;
  cost_type: "INTERNAL" | "CLIENT";
  billable_amount: number;
  cost_date: string | Date;
  created_at: Date;
};

type LabelRow = RowDataPacket & {
  id: number;
  task_id: number;
  name: string;
  color: string;
};

type LabelDefinitionRow = RowDataPacket & {
  id: number;
  name: string;
  color: string;
};

const taskSelect = `SELECT
  t.id, t.subject_type, t.client_id, c.name AS client_name, t.person_name,
  t.invoice_id, i.invoice_number, t.project_id, COALESCE(p.name, t.project_name) AS project_name,
  t.project_milestone_id, pm.name AS project_milestone_name,
  t.project_billing_type,
  t.title, t.description, t.assignee_name, t.priority, t.status,
  t.start_date, t.due_date, t.estimated_minutes, t.spent_minutes, t.notes,
  t.billable, t.billing_type, t.invoice_description, t.quantity, t.unit_price, t.hourly_cost_rate,
  t.vat_rate, t.discount_percent, t.billing_status, t.completed_at,
  t.invoice_queued_at, t.created_at, t.updated_at
 FROM tasks t
 LEFT JOIN clients c ON c.id = t.client_id AND c.deleted_at IS NULL
 LEFT JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL
 LEFT JOIN project_milestones pm ON pm.id = t.project_milestone_id AND pm.project_id = t.project_id AND pm.organization_id = t.organization_id
 LEFT JOIN invoices i ON i.id = t.invoice_id`;

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function billingTotal(row: TaskRow, extraCosts: TaskExtraCost[] = []): number {
  const gross = Number(row.quantity) * Number(row.unit_price);
  const net = row.billable ? gross * (1 - Number(row.discount_percent) / 100) : 0;
  const billableExtras = extraCosts.reduce((total, cost) => total + cost.billableAmount, 0);
  return Number(((net + billableExtras) * (1 + Number(row.vat_rate) / 100)).toFixed(2));
}

function mapTask(
  row: TaskRow,
  subtasks: TaskSubtask[] = [],
  timeEntries: TaskTimeEntry[] = [],
  noteEntries: TaskNoteEntry[] = [],
  extraCosts: TaskExtraCost[] = [],
  labels: TaskLabel[] = [],
): Task {
  return {
    id: row.id,
    subjectType: row.subject_type,
    clientId: row.client_id,
    clientName: row.client_name,
    personName: row.person_name,
    subjectName: row.subject_type === "CLIENT" ? (row.client_name ?? "Klient i panjohur") : (row.person_name ?? "Person i panjohur"),
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    projectId: row.project_id,
    projectName: row.project_name,
    projectMilestoneId: row.project_milestone_id,
    projectMilestoneName: row.project_milestone_name,
    projectBillingType: row.project_billing_type,
    title: row.title,
    description: row.description,
    assigneeName: row.assignee_name,
    priority: row.priority,
    status: row.status,
    startDate: dateOnly(row.start_date),
    dueDate: dateOnly(row.due_date),
    estimatedMinutes: Number(row.estimated_minutes),
    spentMinutes: Number(row.spent_minutes),
    notes: row.notes,
    billable: Boolean(row.billable),
    billingType: row.billing_type,
    invoiceDescription: row.invoice_description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    hourlyCostRate: Number(row.hourly_cost_rate),
    vatRate: Number(row.vat_rate),
    discountPercent: Number(row.discount_percent),
    billingStatus: row.billing_status,
    billingTotal: billingTotal(row, extraCosts),
    billableExtraCostTotal: extraCosts.reduce((total, cost) => total + cost.billableAmount, 0),
    completedAt: row.completed_at?.toISOString() ?? null,
    invoiceQueuedAt: row.invoice_queued_at?.toISOString() ?? null,
    subtasks,
    timeEntries,
    noteEntries,
    extraCosts,
    labels,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function loadSubtasks(taskIds: number[]): Promise<Map<number, TaskSubtask[]>> {
  const result = new Map<number, TaskSubtask[]>();
  if (taskIds.length === 0) return result;
  const placeholders = taskIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<SubtaskRow[]>(
    `SELECT id, task_id, title, is_completed FROM task_subtasks
     WHERE task_id IN (${placeholders}) ORDER BY task_id, sort_order, id`,
    taskIds,
  );
  for (const row of rows) {
    const items = result.get(row.task_id) ?? [];
    items.push({ id: row.id, title: row.title, completed: Boolean(row.is_completed) });
    result.set(row.task_id, items);
  }
  return result;
}

async function loadTimeEntries(taskIds: number[]): Promise<Map<number, TaskTimeEntry[]>> {
  const result = new Map<number, TaskTimeEntry[]>();
  if (taskIds.length === 0) return result;
  const placeholders = taskIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<TimeRow[]>(
    `SELECT id, task_id, work_date, start_time, end_time, minutes, note, created_at
     FROM task_time_entries WHERE task_id IN (${placeholders})
     ORDER BY work_date DESC, id DESC`,
    taskIds,
  );
  for (const row of rows) {
    const items = result.get(row.task_id) ?? [];
    items.push({
      id: row.id,
      workDate: dateOnly(row.work_date) ?? "",
      startTime: row.start_time?.slice(0, 5) ?? null,
      endTime: row.end_time?.slice(0, 5) ?? null,
      minutes: Number(row.minutes),
      note: row.note,
      createdAt: row.created_at.toISOString(),
    });
    result.set(row.task_id, items);
  }
  return result;
}

async function loadNotes(taskIds: number[]): Promise<Map<number, TaskNoteEntry[]>> {
  const result = new Map<number, TaskNoteEntry[]>();
  if (taskIds.length === 0) return result;
  const placeholders = taskIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<NoteRow[]>(
    `SELECT id, task_id, note, created_at FROM task_notes
     WHERE task_id IN (${placeholders}) ORDER BY created_at DESC, id DESC`,
    taskIds,
  );
  for (const row of rows) {
    const items = result.get(row.task_id) ?? [];
    items.push({ id: row.id, note: row.note, createdAt: row.created_at.toISOString() });
    result.set(row.task_id, items);
  }
  return result;
}

async function loadExtraCosts(taskIds: number[]): Promise<Map<number, TaskExtraCost[]>> {
  const result = new Map<number, TaskExtraCost[]>();
  if (taskIds.length === 0) return result;
  const placeholders = taskIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<ExtraCostRow[]>(
    `SELECT id, task_id, description, amount, cost_type, billable_amount, cost_date, created_at
     FROM task_extra_costs WHERE task_id IN (${placeholders})
     ORDER BY cost_date DESC, id DESC`,
    taskIds,
  );
  for (const row of rows) {
    const items = result.get(row.task_id) ?? [];
    items.push({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      costType: row.cost_type,
      billableAmount: Number(row.billable_amount),
      costDate: dateOnly(row.cost_date) ?? "",
      createdAt: row.created_at.toISOString(),
    });
    result.set(row.task_id, items);
  }
  return result;
}

async function loadTaskLabels(taskIds: number[]): Promise<Map<number, TaskLabel[]>> {
  const result = new Map<number, TaskLabel[]>();
  if (taskIds.length === 0) return result;
  const placeholders = taskIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<LabelRow[]>(
    `SELECT l.id, link.task_id, l.name, l.color
     FROM task_label_links link INNER JOIN labels l ON l.id = link.label_id
     WHERE link.task_id IN (${placeholders}) ORDER BY l.name`,
    taskIds,
  );
  for (const row of rows) {
    const items = result.get(row.task_id) ?? [];
    items.push({ id: row.id, name: row.name, color: row.color });
    result.set(row.task_id, items);
  }
  return result;
}

async function loadRelations(taskIds: number[]) {
  const [subtasks, timeEntries, noteEntries, extraCosts, labels] = await Promise.all([
    loadSubtasks(taskIds), loadTimeEntries(taskIds), loadNotes(taskIds), loadExtraCosts(taskIds), loadTaskLabels(taskIds),
  ]);
  return { subtasks, timeEntries, noteEntries, extraCosts, labels };
}

export async function listTasks(organizationId: number, filters: TaskFilters = {}): Promise<Task[]> {
  const clauses = ["t.organization_id = ?", "t.deleted_at IS NULL"];
  const values: Array<string | number> = [organizationId];
  if (filters.status) { clauses.push("t.status = ?"); values.push(filters.status); }
  if (filters.priority) { clauses.push("t.priority = ?"); values.push(filters.priority); }
  if (filters.billingStatus) { clauses.push("t.billing_status = ?"); values.push(filters.billingStatus); }
  if (filters.clientId) { clauses.push("t.client_id = ?"); values.push(filters.clientId); }
  if (filters.projectId) { clauses.push("t.project_id = ?"); values.push(filters.projectId); }
  if (filters.search) {
    clauses.push("(t.title LIKE ? OR t.description LIKE ? OR COALESCE(p.name, t.project_name) LIKE ? OR c.name LIKE ? OR t.person_name LIKE ?)");
    const query = `%${filters.search}%`;
    values.push(query, query, query, query, query);
  }
  const [rows] = await getDbPool().query<TaskRow[]>(
    `${taskSelect} WHERE ${clauses.join(" AND ")}
     ORDER BY FIELD(t.status,'IN_PROGRESS','NEW','WAITING','COMPLETED'),
       FIELD(t.priority,'URGENT','HIGH','NORMAL','LOW'), t.due_date IS NULL, t.due_date, t.updated_at DESC
     LIMIT 500`,
    values,
  );
  const relations = await loadRelations(rows.map((row) => row.id));
  return rows.map((row) => mapTask(
    row,
    relations.subtasks.get(row.id) ?? [],
    relations.timeEntries.get(row.id) ?? [],
    relations.noteEntries.get(row.id) ?? [],
    relations.extraCosts.get(row.id) ?? [],
    relations.labels.get(row.id) ?? [],
  ));
}

export async function findTaskById(organizationId: number, taskId: number): Promise<Task | null> {
  const [rows] = await getDbPool().query<TaskRow[]>(
    `${taskSelect} WHERE t.organization_id = ? AND t.id = ? AND t.deleted_at IS NULL LIMIT 1`,
    [organizationId, taskId],
  );
  if (!rows[0]) return null;
  const relations = await loadRelations([taskId]);
  const [historyRows] = await getDbPool().query<HistoryRow[]>(
    `SELECT id, action, details, created_at FROM task_history
     WHERE organization_id = ? AND task_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`,
    [organizationId, taskId],
  );
  const task = mapTask(
    rows[0],
    relations.subtasks.get(taskId) ?? [],
    relations.timeEntries.get(taskId) ?? [],
    relations.noteEntries.get(taskId) ?? [],
    relations.extraCosts.get(taskId) ?? [],
    relations.labels.get(taskId) ?? [],
  );
  task.history = historyRows.map((row): TaskHistoryEntry => ({
    id: row.id,
    action: row.action,
    details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
    createdAt: row.created_at.toISOString(),
  }));
  return task;
}

export async function countOpenTasksInMilestone(organizationId: number, projectMilestoneId: number): Promise<number> {
  const [rows] = await getDbPool().query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM tasks WHERE organization_id = ? AND project_milestone_id = ?
     AND status <> 'COMPLETED' AND deleted_at IS NULL`,
    [organizationId, projectMilestoneId],
  );
  return Number(rows[0]?.total ?? 0);
}

async function insertHistory(
  connection: PoolConnection,
  organizationId: number,
  taskId: number,
  action: string,
  details: Record<string, unknown> | null,
) {
  await connection.execute(
    `INSERT INTO task_history (organization_id, task_id, action, details) VALUES (?, ?, ?, ?)`,
    [organizationId, taskId, action, details ? JSON.stringify(details) : null],
  );
}

async function replaceSubtasks(
  connection: PoolConnection,
  taskId: number,
  subtasks: TaskInput["subtasks"],
) {
  await connection.execute("DELETE FROM task_subtasks WHERE task_id = ?", [taskId]);
  for (const [index, subtask] of (subtasks ?? []).entries()) {
    await connection.execute(
      `INSERT INTO task_subtasks (task_id, title, is_completed, sort_order) VALUES (?, ?, ?, ?)`,
      [taskId, subtask.title, subtask.completed ? 1 : 0, index],
    );
  }
}

async function replaceLabels(connection: PoolConnection, taskId: number, labelIds: number[] = []) {
  await connection.execute("DELETE FROM task_label_links WHERE task_id = ?", [taskId]);
  for (const labelId of [...new Set(labelIds)]) {
    await connection.execute(
      "INSERT INTO task_label_links (task_id, label_id) VALUES (?, ?)",
      [taskId, labelId],
    );
  }
}

export async function insertTask(organizationId: number, input: TaskInput): Promise<Task> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const billingStatus = input.billable ? "NOT_READY" : "NOT_BILLABLE";
    const completedAt = input.status === "COMPLETED" ? new Date() : null;
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO tasks (
        organization_id, subject_type, client_id, person_name, project_id, project_milestone_id, project_name, project_billing_type,
        title, description, assignee_name,
        priority, status, start_date, due_date, estimated_minutes, spent_minutes, notes,
        billable, billing_type, invoice_description, quantity, unit_price, hourly_cost_rate, vat_rate,
        discount_percent, billing_status, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId, input.subjectType, input.clientId ?? null, input.personName ?? null,
        input.projectId ?? null, input.projectMilestoneId ?? null, input.projectName ?? null, input.projectBillingType ?? "NON_BILLABLE", input.title,
        input.description ?? null, input.assigneeName ?? null, input.priority, input.status,
        input.startDate ?? null, input.dueDate ?? null, input.estimatedMinutes, input.spentMinutes ?? 0,
        input.notes ?? null, input.billable ? 1 : 0, input.billingType,
        input.invoiceDescription ?? input.title, input.quantity, input.unitPrice, input.hourlyCostRate ?? 0, input.vatRate,
        input.discountPercent, billingStatus, completedAt,
      ],
    );
    await replaceSubtasks(connection, result.insertId, input.subtasks);
    await replaceLabels(connection, result.insertId, input.labelIds);
    await insertHistory(connection, organizationId, result.insertId, "TASK_CREATED", { status: input.status });
    await connection.commit();
    const task = await findTaskById(organizationId, result.insertId);
    if (!task) throw new Error("Task was created but could not be loaded.");
    return task;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTaskRecord(
  organizationId: number,
  taskId: number,
  input: Partial<TaskInput>,
): Promise<Task | null> {
  const mapping: Record<string, string> = {
    subjectType: "subject_type", clientId: "client_id", personName: "person_name",
    projectId: "project_id", projectMilestoneId: "project_milestone_id", projectName: "project_name", projectBillingType: "project_billing_type", title: "title",
    description: "description", assigneeName: "assignee_name", priority: "priority",
    status: "status", startDate: "start_date", dueDate: "due_date",
    estimatedMinutes: "estimated_minutes", spentMinutes: "spent_minutes", notes: "notes",
    billable: "billable", billingType: "billing_type", invoiceDescription: "invoice_description",
    quantity: "quantity", unitPrice: "unit_price", vatRate: "vat_rate",
    hourlyCostRate: "hourly_cost_rate",
    discountPercent: "discount_percent",
  };
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      fields.push(`${column} = ?`);
      const value = input[key as keyof TaskInput];
      values.push(typeof value === "boolean" ? (value ? 1 : 0) : (value as string | number | null));
    }
  }
  if (Object.prototype.hasOwnProperty.call(input, "billable")) {
    fields.push("billing_status = ?");
    values.push(input.billable ? "NOT_READY" : "NOT_BILLABLE");
  }
  if (Object.prototype.hasOwnProperty.call(input, "status")) {
    fields.push(
      input.status === "COMPLETED"
        ? "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)"
        : "completed_at = NULL",
    );
  }

  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    if (fields.length > 0) {
      values.push(organizationId, taskId);
      await connection.execute(
        `UPDATE tasks SET ${fields.join(", ")}
         WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
        values,
      );
    }
    if (Object.prototype.hasOwnProperty.call(input, "subtasks")) {
      await replaceSubtasks(connection, taskId, input.subtasks);
    }
    if (Object.prototype.hasOwnProperty.call(input, "labelIds")) {
      await replaceLabels(connection, taskId, input.labelIds);
    }
    await insertHistory(connection, organizationId, taskId, "TASK_UPDATED", input as Record<string, unknown>);
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function softDeleteTaskRecord(organizationId: number, taskId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<import("mysql2").ResultSetHeader>(
    `UPDATE tasks
     SET deleted_at = CURRENT_TIMESTAMP, invoice_queued_at = NULL
     WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [organizationId, taskId],
  );
  return result.affectedRows > 0;
}

export async function addTaskTimeRecord(
  organizationId: number,
  taskId: number,
  input: { workDate: string; startTime: string | null; endTime: string | null; minutes: number; note: string | null },
): Promise<Task | null> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO task_time_entries
        (organization_id, task_id, work_date, start_time, end_time, minutes, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, taskId, input.workDate, input.startTime, input.endTime, input.minutes, input.note],
    );
    await connection.execute(
      `UPDATE tasks SET spent_minutes = (
         SELECT COALESCE(SUM(entry.minutes), 0) FROM task_time_entries entry WHERE entry.task_id = ?
       ) WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
      [taskId, organizationId, taskId],
    );
    await insertHistory(connection, organizationId, taskId, "TIME_ADDED", { minutes: input.minutes, workDate: input.workDate });
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTaskTimeRecord(
  organizationId: number,
  taskId: number,
  entryId: number,
): Promise<Task | null> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM task_time_entries WHERE organization_id = ? AND task_id = ? AND id = ?",
      [organizationId, taskId, entryId],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }
    await connection.execute(
      `UPDATE tasks SET spent_minutes = (
         SELECT COALESCE(SUM(entry.minutes), 0) FROM task_time_entries entry WHERE entry.task_id = ?
       ) WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
      [taskId, organizationId, taskId],
    );
    await insertHistory(connection, organizationId, taskId, "TIME_DELETED", { entryId });
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addTaskNoteRecord(
  organizationId: number,
  taskId: number,
  note: string,
): Promise<Task | null> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "INSERT INTO task_notes (organization_id, task_id, note) VALUES (?, ?, ?)",
      [organizationId, taskId, note],
    );
    await insertHistory(connection, organizationId, taskId, "NOTE_ADDED", null);
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addTaskExtraCostRecord(
  organizationId: number,
  taskId: number,
  input: TaskExtraCostInput,
): Promise<Task | null> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO task_extra_costs
        (organization_id, task_id, description, amount, cost_type, billable_amount, cost_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, taskId, input.description, input.amount, input.costType, input.billableAmount, input.costDate],
    );
    if (input.costType === "CLIENT") {
      await connection.execute(
        `UPDATE tasks SET billing_status = 'NOT_READY'
         WHERE organization_id = ? AND id = ? AND billing_status = 'NOT_BILLABLE'`,
        [organizationId, taskId],
      );
    }
    await insertHistory(connection, organizationId, taskId, "EXTRA_COST_ADDED", {
      description: input.description, amount: input.amount, costType: input.costType,
      billableAmount: input.billableAmount, costDate: input.costDate,
    });
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTaskExtraCostRecord(
  organizationId: number,
  taskId: number,
  costId: number,
): Promise<Task | null> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM task_extra_costs WHERE organization_id = ? AND task_id = ? AND id = ?",
      [organizationId, taskId, costId],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }
    await connection.execute(
      `UPDATE tasks t SET billing_status = 'NOT_BILLABLE', invoice_queued_at = NULL
       WHERE t.organization_id = ? AND t.id = ? AND t.billable = FALSE
         AND t.billing_status IN ('NOT_READY', 'PENDING')
         AND NOT EXISTS (
           SELECT 1 FROM task_extra_costs tec
           WHERE tec.organization_id = t.organization_id AND tec.task_id = t.id
             AND tec.cost_type = 'CLIENT' AND tec.billable_amount > 0
         )`,
      [organizationId, taskId],
    );
    await insertHistory(connection, organizationId, taskId, "EXTRA_COST_DELETED", { costId });
    await connection.commit();
    return findTaskById(organizationId, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listLabelDefinitions(organizationId: number): Promise<TaskLabel[]> {
  const [rows] = await getDbPool().query<LabelDefinitionRow[]>(
    "SELECT id, name, color FROM labels WHERE organization_id = ? ORDER BY name",
    [organizationId],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, color: row.color }));
}

export async function createLabelDefinition(
  organizationId: number,
  name: string,
  color: string,
): Promise<TaskLabel> {
  const [existing] = await getDbPool().query<LabelDefinitionRow[]>(
    "SELECT id, name, color FROM labels WHERE organization_id = ? AND name = ? LIMIT 1",
    [organizationId, name],
  );
  if (existing[0]) return { id: existing[0].id, name: existing[0].name, color: existing[0].color };
  const [result] = await getDbPool().execute<ResultSetHeader>(
    "INSERT INTO labels (organization_id, name, color) VALUES (?, ?, ?)",
    [organizationId, name, color],
  );
  return { id: result.insertId, name, color };
}

export async function updateLabelDefinition(
  organizationId: number,
  labelId: number,
  name: string,
  color: string,
): Promise<TaskLabel | null> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    "UPDATE labels SET name = ?, color = ? WHERE organization_id = ? AND id = ?",
    [name, color, organizationId, labelId],
  );
  if (result.affectedRows === 0) return null;
  const [rows] = await getDbPool().query<LabelDefinitionRow[]>(
    "SELECT id, name, color FROM labels WHERE organization_id = ? AND id = ? LIMIT 1",
    [organizationId, labelId],
  );
  return rows[0] ? { id: rows[0].id, name: rows[0].name, color: rows[0].color } : null;
}

export async function deleteLabelDefinition(organizationId: number, labelId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    "DELETE FROM labels WHERE organization_id = ? AND id = ?",
    [organizationId, labelId],
  );
  return result.affectedRows > 0;
}

export async function setTaskBillingQueue(
  organizationId: number,
  taskId: number,
  queued: boolean,
): Promise<boolean> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      queued
        ? `UPDATE tasks SET billing_status = 'PENDING', invoice_queued_at = CURRENT_TIMESTAMP
           WHERE organization_id = ? AND id = ? AND status = 'COMPLETED'
             AND billing_status IN ('NOT_READY', 'NOT_BILLABLE') AND deleted_at IS NULL
             AND (billable = TRUE OR EXISTS (
               SELECT 1 FROM task_extra_costs tec
               WHERE tec.organization_id = tasks.organization_id AND tec.task_id = tasks.id
                 AND tec.cost_type = 'CLIENT' AND tec.billable_amount > 0
             ))`
        : `UPDATE tasks SET billing_status = CASE
             WHEN billable = TRUE OR EXISTS (
               SELECT 1 FROM task_extra_costs tec
               WHERE tec.organization_id = tasks.organization_id AND tec.task_id = tasks.id
                 AND tec.cost_type = 'CLIENT' AND tec.billable_amount > 0
             ) THEN 'NOT_READY' ELSE 'NOT_BILLABLE' END,
             invoice_queued_at = NULL
           WHERE organization_id = ? AND id = ? AND billing_status = 'PENDING' AND deleted_at IS NULL`,
      [organizationId, taskId],
    );
    if (result.affectedRows > 0) {
      await insertHistory(connection, organizationId, taskId, queued ? "BILLING_QUEUED" : "BILLING_UNQUEUED", null);
    }
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
