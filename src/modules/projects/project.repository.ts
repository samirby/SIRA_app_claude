import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ApiError } from "@/core/http/api-error";
import { getDbPool } from "@/core/db/pool";
import type { Project, ProjectBillingStatus, ProjectInput, ProjectLabel, ProjectStatus, ProjectType } from "./project.types";

type ProjectRow = RowDataPacket & {
  id: number;
  client_id: number | null;
  client_name: string | null;
  product_id: number | null;
  product_name_snapshot: string | null;
  product_description_snapshot: string | null;
  project_type: ProjectType;
  name: string;
  description: string | null;
  base_price: number;
  vat_rate: number;
  discount_percent: number;
  status: ProjectStatus;
  start_date: string | Date | null;
  due_date: string | Date | null;
  estimated_minutes: number;
  cost_budget: number;
  billing_status: ProjectBillingStatus;
  invoice_id: number | null;
  invoice_number: string | null;
  completed_at: Date | null;
  task_count: number;
  completed_task_count: number;
  spent_minutes: number;
  internal_cost_total: number;
  billable_extra_cost_total: number;
  extra_task_net: number;
  created_at: Date;
  updated_at: Date;
};

type InvoiceProjectRow = RowDataPacket & {
  id: number;
  client_id: number;
  name: string;
  product_name_snapshot: string | null;
  base_price: number;
  vat_rate: number;
  discount_percent: number;
  status: ProjectStatus;
  billing_status: ProjectBillingStatus;
  invoice_id: number | null;
};

type InvoiceTaskRow = RowDataPacket & {
  id: number;
  title: string;
  project_billing_type: "INCLUDED" | "EXTRA_BILLABLE" | "NON_BILLABLE";
  billable: number | boolean;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  billable_cost: number;
};

type ProjectLabelRow = RowDataPacket & {
  project_id: number;
  id: number;
  name: string;
  color: string;
};

const projectSelect = `SELECT
  p.id, p.client_id, c.name AS client_name, p.product_id, p.product_name_snapshot,
  p.product_description_snapshot, p.project_type, p.name, p.description, p.base_price, p.vat_rate,
  p.discount_percent, p.status, p.start_date, p.due_date, p.estimated_minutes, p.cost_budget, p.billing_status,
  p.invoice_id, i.invoice_number, p.completed_at, p.created_at, p.updated_at,
  (SELECT COUNT(*) FROM tasks t WHERE t.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL) AS task_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.organization_id = p.organization_id AND t.project_id = p.id AND t.status = 'COMPLETED' AND t.deleted_at IS NULL) AS completed_task_count,
  (SELECT COALESCE(SUM(t.spent_minutes), 0) FROM tasks t WHERE t.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL) AS spent_minutes,
  (SELECT COALESCE(SUM((t.spent_minutes / 60) * t.hourly_cost_rate), 0) FROM tasks t WHERE t.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL)
    + (SELECT COALESCE(SUM(ec.amount), 0) FROM task_extra_costs ec INNER JOIN tasks t ON t.id = ec.task_id WHERE ec.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL AND ec.cost_type = 'INTERNAL') AS internal_cost_total,
  (SELECT COALESCE(SUM(ec.billable_amount), 0) FROM task_extra_costs ec INNER JOIN tasks t ON t.id = ec.task_id WHERE ec.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL AND ec.cost_type = 'CLIENT') AS billable_extra_cost_total,
  (SELECT COALESCE(SUM(t.quantity * t.unit_price * (1 - t.discount_percent / 100)), 0) FROM tasks t WHERE t.organization_id = p.organization_id AND t.project_id = p.id AND t.deleted_at IS NULL AND t.project_billing_type = 'EXTRA_BILLABLE' AND t.billable = TRUE) AS extra_task_net
 FROM projects p
 LEFT JOIN clients c ON c.id = p.client_id AND c.deleted_at IS NULL
 LEFT JOIN invoices i ON i.id = p.invoice_id`;

function dateOnly(value: string | Date | null) {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function round(value: number) { return Number(value.toFixed(2)); }

function mapProject(row: ProjectRow): Project {
  const baseNet = Number(row.base_price) * (1 - Number(row.discount_percent) / 100);
  const billingNet = round(baseNet + Number(row.extra_task_net) + Number(row.billable_extra_cost_total));
  const billingTax = round(billingNet * Number(row.vat_rate) / 100);
  const profit = round(billingNet - Number(row.internal_cost_total));
  const profitMargin = billingNet > 0 ? round((profit / billingNet) * 100) : 0;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    productId: row.product_id,
    productName: row.product_name_snapshot,
    productDescription: row.product_description_snapshot,
    projectType: row.project_type,
    name: row.name,
    description: row.description,
    basePrice: Number(row.base_price),
    vatRate: Number(row.vat_rate),
    discountPercent: Number(row.discount_percent),
    status: row.status,
    startDate: dateOnly(row.start_date),
    dueDate: dateOnly(row.due_date),
    estimatedMinutes: Number(row.estimated_minutes),
    costBudget: Number(row.cost_budget),
    billingStatus: row.billing_status,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    completedAt: row.completed_at?.toISOString() ?? null,
    taskCount: Number(row.task_count),
    completedTaskCount: Number(row.completed_task_count),
    spentMinutes: Number(row.spent_minutes),
    internalCostTotal: round(Number(row.internal_cost_total)),
    billableExtraCostTotal: round(Number(row.billable_extra_cost_total)),
    extraTaskNet: round(Number(row.extra_task_net)),
    billingNet,
    billingTax,
    billingTotal: round(billingNet + billingTax),
    profit,
    profitMargin,
    labels: [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function attachProjectLabels(organizationId: number, projects: Project[]): Promise<Project[]> {
  if (!projects.length) return projects;
  const projectIds = projects.map((project) => project.id);
  const placeholders = projectIds.map(() => "?").join(",");
  const [rows] = await getDbPool().query<ProjectLabelRow[]>(
    `SELECT DISTINCT t.project_id, l.id, l.name, l.color
     FROM tasks t
     INNER JOIN task_label_links link ON link.task_id = t.id
     INNER JOIN labels l ON l.id = link.label_id AND l.organization_id = t.organization_id
     WHERE t.organization_id = ? AND t.project_id IN (${placeholders}) AND t.deleted_at IS NULL
     ORDER BY t.project_id, l.name`,
    [organizationId, ...projectIds],
  );
  const labelsByProject = new Map<number, ProjectLabel[]>();
  for (const row of rows) {
    const labels = labelsByProject.get(row.project_id) ?? [];
    labels.push({ id: row.id, name: row.name, color: row.color });
    labelsByProject.set(row.project_id, labels);
  }
  return projects.map((project) => ({ ...project, labels: labelsByProject.get(project.id) ?? [] }));
}

export async function listProjects(organizationId: number, activeOnly = false): Promise<Project[]> {
  const activeClause = activeOnly ? "AND p.status IN ('OPEN','IN_PROGRESS','ON_HOLD')" : "";
  const [rows] = await getDbPool().query<ProjectRow[]>(
    `${projectSelect} WHERE p.organization_id = ? AND p.deleted_at IS NULL ${activeClause}
     ORDER BY FIELD(p.status,'IN_PROGRESS','OPEN','ON_HOLD','COMPLETED','CANCELLED'), p.updated_at DESC`,
    [organizationId],
  );
  return attachProjectLabels(organizationId, rows.map(mapProject));
}

export async function findProjectById(organizationId: number, projectId: number): Promise<Project | null> {
  const [rows] = await getDbPool().query<ProjectRow[]>(
    `${projectSelect} WHERE p.organization_id = ? AND p.id = ? AND p.deleted_at IS NULL LIMIT 1`,
    [organizationId, projectId],
  );
  if (!rows[0]) return null;
  return (await attachProjectLabels(organizationId, [mapProject(rows[0])]))[0] ?? null;
}

export async function insertProject(organizationId: number, input: ProjectInput): Promise<Project> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO projects (
      organization_id, client_id, product_id, product_name_snapshot, product_description_snapshot, project_type,
      name, description, base_price, vat_rate, discount_percent, status, start_date, due_date,
      estimated_minutes, cost_budget, billing_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_READY')`,
    [organizationId, input.clientId, input.productId ?? null, input.productName ?? null,
      input.productDescription ?? null, input.projectType, input.name, input.description ?? null, input.basePrice,
      input.vatRate, input.discountPercent, input.status, input.startDate ?? null, input.dueDate ?? null,
      input.estimatedMinutes, input.costBudget],
  );
  const project = await findProjectById(organizationId, result.insertId);
  if (!project) throw new Error("Project was created but could not be loaded.");
  return project;
}

export async function updateProjectRecord(
  organizationId: number,
  projectId: number,
  input: Partial<ProjectInput>,
): Promise<Project | null> {
  const mapping: Record<string, string> = {
    clientId: "client_id", productId: "product_id", projectType: "project_type", name: "name", description: "description",
    basePrice: "base_price", vatRate: "vat_rate", discountPercent: "discount_percent",
    status: "status", startDate: "start_date", dueDate: "due_date",
    estimatedMinutes: "estimated_minutes", costBudget: "cost_budget",
  };
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`);
    values.push(input[key as keyof ProjectInput] as string | number | null);
  }
  if (Object.prototype.hasOwnProperty.call(input, "status")) {
    fields.push(input.status === "COMPLETED" ? "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)" : "completed_at = NULL");
  }
  if (!fields.length) return findProjectById(organizationId, projectId);
  values.push(organizationId, projectId);
  await getDbPool().execute(
    `UPDATE projects SET ${fields.join(", ")} WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    values,
  );
  return findProjectById(organizationId, projectId);
}

export async function softDeleteProjectRecord(organizationId: number, projectId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE projects SET deleted_at = CURRENT_TIMESTAMP
     WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [organizationId, projectId],
  );
  return result.affectedRows > 0;
}

export async function countOpenProjectTasks(organizationId: number, projectId: number): Promise<number> {
  const [rows] = await getDbPool().query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM tasks WHERE organization_id = ? AND project_id = ?
     AND status <> 'COMPLETED' AND deleted_at IS NULL`,
    [organizationId, projectId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function setProjectBillingState(
  organizationId: number,
  projectId: number,
  billingStatus: ProjectBillingStatus,
): Promise<Project | null> {
  await getDbPool().execute(
    `UPDATE projects SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP), billing_status = ?
     WHERE organization_id = ? AND id = ? AND deleted_at IS NULL AND invoice_id IS NULL`,
    [billingStatus, organizationId, projectId],
  );
  return findProjectById(organizationId, projectId);
}

export async function createProjectInvoiceDraftRecord(organizationId: number, projectId: number): Promise<Project> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [projectRows] = await connection.query<InvoiceProjectRow[]>(
      `SELECT id, client_id, name, product_name_snapshot, base_price, vat_rate, discount_percent,
        status, billing_status, invoice_id FROM projects
       WHERE organization_id = ? AND id = ? AND deleted_at IS NULL FOR UPDATE`,
      [organizationId, projectId],
    );
    const project = projectRows[0];
    if (!project) throw new ApiError(404, "Projekti nuk u gjet.", "PROJECT_NOT_FOUND");
    if (project.invoice_id || ["DRAFTED", "INVOICED"].includes(project.billing_status)) {
      throw new ApiError(409, "Projekti është lidhur tashmë me faturë.", "PROJECT_ALREADY_INVOICED");
    }
    const [taskRows] = await connection.query<InvoiceTaskRow[]>(
      `SELECT t.id, t.title, t.project_billing_type, t.billable, t.quantity, t.unit_price,
        t.discount_percent, COALESCE(SUM(CASE WHEN ec.cost_type = 'CLIENT' THEN ec.billable_amount ELSE 0 END), 0) AS billable_cost
       FROM tasks t LEFT JOIN task_extra_costs ec ON ec.task_id = t.id AND ec.organization_id = t.organization_id
       WHERE t.organization_id = ? AND t.project_id = ? AND t.status = 'COMPLETED'
         AND t.deleted_at IS NULL AND t.invoice_id IS NULL
       GROUP BY t.id, t.title, t.project_billing_type, t.billable, t.quantity, t.unit_price, t.discount_percent`,
      [organizationId, projectId],
    );
    const vatRate = Number(project.vat_rate);
    const baseNet = round(Number(project.base_price) * (1 - Number(project.discount_percent) / 100));
    const lines: Array<{ taskId: number | null; description: string; net: number; tax: number; total: number }> = [];
    if (baseNet > 0) {
      const tax = round(baseNet * vatRate / 100);
      lines.push({ taskId: null, description: project.product_name_snapshot || project.name, net: baseNet, tax, total: round(baseNet + tax) });
    }
    for (const task of taskRows) {
      const workNet = task.project_billing_type === "EXTRA_BILLABLE" && Boolean(task.billable)
        ? round(Number(task.quantity) * Number(task.unit_price) * (1 - Number(task.discount_percent) / 100)) : 0;
      const costNet = round(Number(task.billable_cost));
      const net = round(workNet + costNet);
      if (net <= 0) continue;
      const tax = round(net * vatRate / 100);
      lines.push({ taskId: task.id, description: workNet > 0 ? task.title : `Kosto shtesë: ${task.title}`, net, tax, total: round(net + tax) });
    }
    if (!lines.length) throw new ApiError(409, "Projekti nuk ka pozicione për faturim.", "PROJECT_NOT_BILLABLE");
    const subtotal = round(lines.reduce((sum, line) => sum + line.net, 0));
    const taxTotal = round(lines.reduce((sum, line) => sum + line.tax, 0));
    const total = round(lines.reduce((sum, line) => sum + line.total, 0));
    const issueDate = new Date().toISOString().slice(0, 10);
    const dueDateValue = new Date(`${issueDate}T12:00:00`); dueDateValue.setDate(dueDateValue.getDate() + 14);
    const temporaryNumber = `TMP-${randomUUID()}`;
    const [invoiceResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO invoices (organization_id, client_id, invoice_number, issue_date, due_date, notes,
        subtotal, discount_total, tax_total, total) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [organizationId, project.client_id, temporaryNumber, issueDate, dueDateValue.toISOString().slice(0, 10),
        `Projekti: ${project.name}`, subtotal, taxTotal, total],
    );
    const invoiceNumber = `RE-${issueDate.slice(0, 4)}-${String(invoiceResult.insertId).padStart(4, "0")}`;
    await connection.execute("UPDATE invoices SET invoice_number = ? WHERE id = ?", [invoiceNumber, invoiceResult.insertId]);
    for (const line of lines) {
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, task_id, description, quantity, unit_label, unit_price,
          vat_rate, discount_percent, net_total, tax_total, line_total)
         VALUES (?, ?, ?, 1, 'projekt', ?, ?, 0, ?, ?, ?)`,
        [invoiceResult.insertId, line.taskId, line.description, line.net, vatRate, line.net, line.tax, line.total],
      );
    }
    const taskIds = lines.flatMap((line) => line.taskId ? [line.taskId] : []);
    if (taskIds.length) {
      const placeholders = taskIds.map(() => "?").join(",");
      await connection.query(
        `UPDATE tasks SET billing_status = 'DRAFTED', invoice_id = ?
         WHERE organization_id = ? AND id IN (${placeholders})`,
        [invoiceResult.insertId, organizationId, ...taskIds],
      );
    }
    await connection.execute(
      `UPDATE projects SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
        billing_status = 'DRAFTED', invoice_id = ? WHERE organization_id = ? AND id = ?`,
      [invoiceResult.insertId, organizationId, projectId],
    );
    await connection.commit();
    const updated = await findProjectById(organizationId, projectId);
    if (!updated) throw new Error("Project invoice was created but the project could not be loaded.");
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
