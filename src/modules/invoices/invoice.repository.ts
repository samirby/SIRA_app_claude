import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ApiError } from "@/core/http/api-error";
import { getDbPool } from "@/core/db/pool";
import type { Invoice, InvoiceDraftInput, InvoiceStatus } from "./invoice.types";

type InvoiceRow = RowDataPacket & {
  id: number;
  client_id: number;
  client_name: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string | Date;
  due_date: string | Date | null;
  notes: string | null;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  item_count: number;
  finalized_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type BillableTaskRow = RowDataPacket & {
  id: number;
  billable: number | boolean;
  title: string;
  invoice_description: string | null;
  billing_type: "FIXED" | "HOURLY";
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_percent: number;
};

type BillableExtraCostRow = RowDataPacket & {
  id: number;
  task_id: number;
  description: string;
  billable_amount: number;
};

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: dateOnly(row.issue_date) ?? "",
    dueDate: dateOnly(row.due_date),
    notes: row.notes,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    itemCount: Number(row.item_count),
    finalizedAt: row.finalized_at?.toISOString() ?? null,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const invoiceSelect = `SELECT
  i.id, i.client_id, c.name AS client_name, i.invoice_number, i.status,
  i.issue_date, i.due_date, i.notes, i.subtotal, i.discount_total,
  i.tax_total, i.total, COUNT(ii.id) AS item_count, i.finalized_at,
  i.cancelled_at, i.created_at, i.updated_at
 FROM invoices i
 INNER JOIN clients c ON c.id = i.client_id
 LEFT JOIN invoice_items ii ON ii.invoice_id = i.id`;

export async function listInvoices(organizationId: number, clientId?: number): Promise<Invoice[]> {
  const values: number[] = [organizationId];
  const clientClause = clientId ? "AND i.client_id = ?" : "";
  if (clientId) values.push(clientId);
  const [rows] = await getDbPool().query<InvoiceRow[]>(
    `${invoiceSelect}
     WHERE i.organization_id = ? ${clientClause}
     GROUP BY i.id, c.name
     ORDER BY i.created_at DESC, i.id DESC LIMIT 300`,
    values,
  );
  return rows.map(mapInvoice);
}

export async function findInvoiceById(organizationId: number, invoiceId: number): Promise<Invoice | null> {
  const [rows] = await getDbPool().query<InvoiceRow[]>(
    `${invoiceSelect}
     WHERE i.organization_id = ? AND i.id = ?
     GROUP BY i.id, c.name LIMIT 1`,
    [organizationId, invoiceId],
  );
  return rows[0] ? mapInvoice(rows[0]) : null;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

export async function createInvoiceDraftRecord(
  organizationId: number,
  input: InvoiceDraftInput,
): Promise<Invoice> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const taskIds = input.items.map((item) => item.taskId);
    const placeholders = taskIds.map(() => "?").join(",");
    const [taskRows] = await connection.query<BillableTaskRow[]>(
      `SELECT id, title, billable, invoice_description, billing_type, quantity, unit_price,
        vat_rate, discount_percent
       FROM tasks
       WHERE organization_id = ? AND client_id = ? AND id IN (${placeholders})
         AND status = 'COMPLETED' AND billing_status = 'PENDING' AND project_id IS NULL AND deleted_at IS NULL
         AND (billable = TRUE OR EXISTS (
           SELECT 1 FROM task_extra_costs tec
           WHERE tec.organization_id = tasks.organization_id AND tec.task_id = tasks.id
             AND tec.cost_type = 'CLIENT' AND tec.billable_amount > 0
         ))
       FOR UPDATE`,
      [organizationId, input.clientId, ...taskIds],
    );
    if (taskRows.length !== taskIds.length) {
      throw new ApiError(409, "Një ose më shumë punë nuk janë më të gatshme për faturim.", "TASK_BILLING_CONFLICT");
    }
    const tasksById = new Map(taskRows.map((task) => [task.id, task]));
    const [extraCostRows] = await connection.query<BillableExtraCostRow[]>(
      `SELECT id, task_id, description, billable_amount
       FROM task_extra_costs
       WHERE organization_id = ? AND task_id IN (${placeholders})
         AND cost_type = 'CLIENT' AND billable_amount > 0
       ORDER BY task_id, cost_date, id`,
      [organizationId, ...taskIds],
    );
    const taskLines = input.items.flatMap((item) => {
      const task = tasksById.get(item.taskId);
      if (!task) throw new ApiError(409, "Puna për faturim nuk u gjet.", "TASK_BILLING_CONFLICT");
      if (!Boolean(task.billable)) return [];
      const quantity = item.quantity ?? Number(task.quantity);
      const unitPrice = item.unitPrice ?? Number(task.unit_price);
      const vatRate = item.vatRate ?? Number(task.vat_rate);
      const discountPercent = item.discountPercent ?? Number(task.discount_percent);
      const gross = round(quantity * unitPrice);
      const discount = round(gross * discountPercent / 100);
      const net = round(gross - discount);
      const tax = round(net * vatRate / 100);
      return [{
        taskId: item.taskId,
        description: item.description ?? task.invoice_description ?? task.title,
        quantity,
        unitPrice,
        vatRate,
        discountPercent,
        unitLabel: task.billing_type === "HOURLY" ? "orë" : "copë",
        gross,
        discount,
        net,
        tax,
        total: round(net + tax),
      }];
    });
    const extraCostLines = extraCostRows.map((cost) => {
      const task = tasksById.get(cost.task_id);
      if (!task) throw new ApiError(409, "Kostoja për faturim nuk i përket një pune valide.", "TASK_BILLING_CONFLICT");
      const invoiceItem = input.items.find((item) => item.taskId === cost.task_id);
      const vatRate = invoiceItem?.vatRate ?? Number(task.vat_rate);
      const gross = round(Number(cost.billable_amount));
      const tax = round(gross * vatRate / 100);
      return {
        taskId: cost.task_id,
        description: `Kosto shtesë: ${cost.description}`,
        quantity: 1,
        unitPrice: gross,
        vatRate,
        discountPercent: 0,
        unitLabel: "copë",
        gross,
        discount: 0,
        net: gross,
        tax,
        total: round(gross + tax),
      };
    });
    const lines = [...taskLines, ...extraCostLines];
    const subtotal = round(lines.reduce((sum, line) => sum + line.gross, 0));
    const discountTotal = round(lines.reduce((sum, line) => sum + line.discount, 0));
    const taxTotal = round(lines.reduce((sum, line) => sum + line.tax, 0));
    const total = round(lines.reduce((sum, line) => sum + line.total, 0));
    const temporaryNumber = `TMP-${randomUUID()}`;
    const [invoiceResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO invoices (
        organization_id, client_id, invoice_number, issue_date, due_date, notes,
        subtotal, discount_total, tax_total, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, input.clientId, temporaryNumber, input.issueDate, input.dueDate ?? null,
        input.notes ?? null, subtotal, discountTotal, taxTotal, total],
    );
    const invoiceNumber = `RE-${input.issueDate.slice(0, 4)}-${String(invoiceResult.insertId).padStart(4, "0")}`;
    await connection.execute("UPDATE invoices SET invoice_number = ? WHERE id = ?", [invoiceNumber, invoiceResult.insertId]);
    for (const line of lines) {
      await connection.execute(
        `INSERT INTO invoice_items (
          invoice_id, task_id, description, quantity, unit_label, unit_price,
          vat_rate, discount_percent, net_total, tax_total, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceResult.insertId, line.taskId, line.description, line.quantity, line.unitLabel,
          line.unitPrice, line.vatRate, line.discountPercent, line.net, line.tax, line.total],
      );
    }
    await connection.query(
      `UPDATE tasks SET billing_status = 'DRAFTED', invoice_id = ?
       WHERE organization_id = ? AND id IN (${placeholders})`,
      [invoiceResult.insertId, organizationId, ...taskIds],
    );
    for (const taskId of taskIds) {
      await connection.execute(
        `INSERT INTO task_history (organization_id, task_id, action, details)
         VALUES (?, ?, 'INVOICE_DRAFTED', ?)`,
        [organizationId, taskId, JSON.stringify({ invoiceId: invoiceResult.insertId, invoiceNumber })],
      );
    }
    await connection.commit();
    const invoice = await findInvoiceById(organizationId, invoiceResult.insertId);
    if (!invoice) throw new Error("Invoice was created but could not be loaded.");
    return invoice;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function finalizeInvoiceRecord(organizationId: number, invoiceId: number): Promise<boolean> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE invoices SET status = 'FINALIZED', finalized_at = CURRENT_TIMESTAMP
       WHERE organization_id = ? AND id = ? AND status = 'DRAFT'`,
      [organizationId, invoiceId],
    );
    if (result.affectedRows > 0) {
      await connection.execute(
        `UPDATE tasks SET billing_status = 'INVOICED'
         WHERE organization_id = ? AND invoice_id = ? AND billing_status = 'DRAFTED'`,
        [organizationId, invoiceId],
      );
      await connection.execute(
        `UPDATE projects SET billing_status = 'INVOICED'
         WHERE organization_id = ? AND invoice_id = ? AND billing_status = 'DRAFTED'`,
        [organizationId, invoiceId],
      );
      await connection.execute(
        `INSERT INTO task_history (organization_id, task_id, action, details)
         SELECT organization_id, id, 'INVOICE_FINALIZED', JSON_OBJECT('invoiceId', ?)
         FROM tasks WHERE organization_id = ? AND invoice_id = ?`,
        [invoiceId, organizationId, invoiceId],
      );
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

export async function cancelInvoiceRecord(organizationId: number, invoiceId: number): Promise<boolean> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE invoices SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
       WHERE organization_id = ? AND id = ? AND status <> 'CANCELLED'`,
      [organizationId, invoiceId],
    );
    if (result.affectedRows > 0) {
      await connection.execute(
        `INSERT INTO task_history (organization_id, task_id, action, details)
         SELECT organization_id, id, 'INVOICE_CANCELLED', JSON_OBJECT('invoiceId', ?)
         FROM tasks WHERE organization_id = ? AND invoice_id = ?`,
        [invoiceId, organizationId, invoiceId],
      );
      await connection.execute(
        `UPDATE tasks SET billing_status = 'PENDING', invoice_id = NULL
         WHERE organization_id = ? AND invoice_id = ?`,
        [organizationId, invoiceId],
      );
      await connection.execute(
        `UPDATE projects SET billing_status = 'PENDING', invoice_id = NULL
         WHERE organization_id = ? AND invoice_id = ?`,
        [organizationId, invoiceId],
      );
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
