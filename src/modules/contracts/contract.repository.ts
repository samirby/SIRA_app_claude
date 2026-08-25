import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type { Contract, ContractInput } from "./contract.types";

type ContractRow = RowDataPacket & {
  id: number;
  owner_type: "CLIENT" | "COMPANY";
  client_id: number | null;
  client_name: string | null;
  product_id: number | null;
  product_name: string | null;
  title: string;
  category: string;
  provider: string | null;
  reference_code: string | null;
  start_date: string | Date;
  end_date: string | Date | null;
  price: number;
  billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";
  reminder_days: number;
  cancellation_notice_days: number;
  auto_renew: number | boolean;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED";
  description: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    ownerType: row.owner_type,
    clientId: row.client_id,
    clientName: row.client_name,
    productId: row.product_id,
    productName: row.product_name,
    title: row.title,
    category: row.category,
    provider: row.provider,
    reference: row.reference_code,
    startDate: dateOnly(row.start_date)!,
    endDate: dateOnly(row.end_date),
    price: Number(row.price),
    cycle: row.billing_cycle,
    reminderDays: Number(row.reminder_days),
    cancellationNoticeDays: Number(row.cancellation_notice_days),
    autoRenew: Boolean(row.auto_renew),
    status: row.status,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const selectSql = `SELECT c.id, c.owner_type, c.client_id, cl.name AS client_name,
  c.product_id, p.name AS product_name, c.title, c.category, c.provider, c.reference_code,
  c.start_date, c.end_date, c.price, c.billing_cycle, c.reminder_days,
  c.cancellation_notice_days, c.auto_renew, c.status, c.description, c.notes,
  c.created_at, c.updated_at
  FROM contracts c
  LEFT JOIN clients cl ON cl.id = c.client_id AND cl.organization_id = c.organization_id
  LEFT JOIN products p ON p.id = c.product_id AND p.organization_id = c.organization_id`;

export async function listContracts(organizationId: number): Promise<Contract[]> {
  const [rows] = await getDbPool().query<ContractRow[]>(
    `${selectSql} WHERE c.organization_id = ? AND c.deleted_at IS NULL
     ORDER BY CASE WHEN c.end_date IS NULL THEN 1 ELSE 0 END, c.end_date ASC, c.updated_at DESC`,
    [organizationId],
  );
  return rows.map(mapContract);
}

export async function findContractById(organizationId: number, contractId: number): Promise<Contract | null> {
  const [rows] = await getDbPool().query<ContractRow[]>(
    `${selectSql} WHERE c.organization_id = ? AND c.id = ? AND c.deleted_at IS NULL LIMIT 1`,
    [organizationId, contractId],
  );
  return rows[0] ? mapContract(rows[0]) : null;
}

export async function insertContract(organizationId: number, input: ContractInput): Promise<Contract> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO contracts
      (organization_id, owner_type, client_id, product_id, title, category, provider, reference_code,
       start_date, end_date, price, billing_cycle, reminder_days, cancellation_notice_days,
       auto_renew, status, description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, input.ownerType, input.ownerType === "CLIENT" ? input.clientId ?? null : null,
      input.productId ?? null, input.title, input.category, input.provider ?? null, input.reference ?? null,
      input.startDate, input.endDate ?? null, input.price, input.cycle, input.reminderDays,
      input.cancellationNoticeDays, input.autoRenew ? 1 : 0, input.status,
      input.description ?? null, input.notes ?? null],
  );
  const created = await findContractById(organizationId, result.insertId);
  if (!created) throw new Error("Contract was created but could not be loaded.");
  return created;
}

export async function updateContractRecord(organizationId: number, contractId: number, input: Partial<ContractInput>) {
  const mapping: Record<string, string> = {
    ownerType: "owner_type", clientId: "client_id", productId: "product_id", title: "title",
    category: "category", provider: "provider", reference: "reference_code", startDate: "start_date",
    endDate: "end_date", price: "price", cycle: "billing_cycle", reminderDays: "reminder_days",
    cancellationNoticeDays: "cancellation_notice_days", autoRenew: "auto_renew", status: "status",
    description: "description", notes: "notes",
  };
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`);
    const raw = input[key as keyof ContractInput];
    values.push(typeof raw === "boolean" ? (raw ? 1 : 0) : (raw as string | number | null));
  }
  if (!fields.length) return findContractById(organizationId, contractId);
  values.push(organizationId, contractId);
  await getDbPool().execute(
    `UPDATE contracts SET ${fields.join(", ")} WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    values,
  );
  return findContractById(organizationId, contractId);
}

export async function softDeleteContractRecord(organizationId: number, contractId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE contracts SET deleted_at = CURRENT_TIMESTAMP WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [organizationId, contractId],
  );
  return result.affectedRows > 0;
}
