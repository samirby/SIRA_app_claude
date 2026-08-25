import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import { withTransaction } from "@/core/db/transaction";
import type { AccessRegistryEntry, AccessRegistryFilters, AccessRegistryInput } from "./access-registry.types";

type AccessRegistryRow = RowDataPacket & {
  id: number;
  client_id: number | null;
  client_name: string | null;
  name: string;
  category: AccessRegistryEntry["category"];
  access_scope: AccessRegistryEntry["scope"];
  provider: string | null;
  address: string | null;
  service_url: string | null;
  username: string | null;
  vault_provider: AccessRegistryEntry["vaultProvider"];
  vault_url: string | null;
  vault_reference: string | null;
  two_factor_status: AccessRegistryEntry["twoFactorStatus"];
  renewal_date: string | Date | null;
  notes: string | null;
  status: AccessRegistryEntry["status"];
  created_at: Date;
  updated_at: Date;
};

const accessSelect = `SELECT a.id, a.client_id, c.name AS client_name, a.name, a.category,
  a.access_scope, a.provider, a.address, a.service_url, a.username, a.vault_provider,
  a.vault_url, a.vault_reference, a.two_factor_status, a.renewal_date, a.notes,
  a.status, a.created_at, a.updated_at
 FROM access_registry_entries a
 LEFT JOIN clients c ON c.id = a.client_id AND c.organization_id = a.organization_id AND c.deleted_at IS NULL`;

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapEntry(row: AccessRegistryRow): AccessRegistryEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    name: row.name,
    category: row.category,
    scope: row.access_scope,
    provider: row.provider,
    address: row.address,
    serviceUrl: row.service_url,
    username: row.username,
    vaultProvider: row.vault_provider,
    vaultUrl: row.vault_url,
    vaultReference: row.vault_reference,
    twoFactorStatus: row.two_factor_status,
    renewalDate: dateOnly(row.renewal_date),
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function findWithConnection(connection: PoolConnection, organizationId: number, entryId: number) {
  const [rows] = await connection.query<AccessRegistryRow[]>(
    `${accessSelect} WHERE a.organization_id = ? AND a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
    [organizationId, entryId],
  );
  return rows[0] ? mapEntry(rows[0]) : null;
}

async function writeAudit(
  connection: PoolConnection,
  organizationId: number,
  entryId: number,
  action: string,
  before: AccessRegistryEntry | null,
  after: AccessRegistryEntry | null,
) {
  await connection.execute(
    `INSERT INTO audit_logs (organization_id, actor_user_id, entity_type, entity_id, action, before_data, after_data)
     VALUES (?, NULL, 'ACCESS_REGISTRY', ?, ?, ?, ?)`,
    [organizationId, String(entryId), action, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null],
  );
}

export async function listAccessRegistryEntries(organizationId: number, filters: AccessRegistryFilters = {}) {
  const conditions = ["a.organization_id = ?", "a.deleted_at IS NULL"];
  const values: Array<string | number> = [organizationId];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push("(a.name LIKE ? OR a.provider LIKE ? OR a.address LIKE ? OR a.username LIKE ? OR c.name LIKE ?)");
    values.push(term, term, term, term, term);
  }
  if (filters.category) { conditions.push("a.category = ?"); values.push(filters.category); }
  if (filters.scope) { conditions.push("a.access_scope = ?"); values.push(filters.scope); }
  if (filters.status) { conditions.push("a.status = ?"); values.push(filters.status); }
  const [rows] = await getDbPool().query<AccessRegistryRow[]>(
    `${accessSelect} WHERE ${conditions.join(" AND ")}
     ORDER BY a.status = 'ACTIVE' DESC, a.renewal_date IS NULL, a.renewal_date, a.name`,
    values,
  );
  return rows.map(mapEntry);
}

export async function findAccessRegistryEntry(organizationId: number, entryId: number) {
  const [rows] = await getDbPool().query<AccessRegistryRow[]>(
    `${accessSelect} WHERE a.organization_id = ? AND a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
    [organizationId, entryId],
  );
  return rows[0] ? mapEntry(rows[0]) : null;
}

export async function insertAccessRegistryEntry(organizationId: number, input: AccessRegistryInput) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO access_registry_entries (
        organization_id, client_id, name, category, access_scope, provider, address,
        service_url, username, vault_provider, vault_url, vault_reference,
        two_factor_status, renewal_date, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, input.clientId ?? null, input.name, input.category, input.scope,
        input.provider ?? null, input.address ?? null, input.serviceUrl ?? null,
        input.username ?? null, input.vaultProvider ?? null, input.vaultUrl ?? null,
        input.vaultReference ?? null, input.twoFactorStatus, input.renewalDate ?? null,
        input.notes ?? null, input.status],
    );
    const entry = await findWithConnection(connection, organizationId, result.insertId);
    if (!entry) throw new Error("Access entry was created but could not be loaded.");
    await writeAudit(connection, organizationId, entry.id, "CREATED", null, entry);
    return entry;
  });
}

export async function updateAccessRegistryEntry(
  organizationId: number,
  entryId: number,
  input: Partial<AccessRegistryInput>,
  current: AccessRegistryEntry,
) {
  const mapping: Record<keyof AccessRegistryInput, string> = {
    clientId: "client_id", name: "name", category: "category", scope: "access_scope",
    provider: "provider", address: "address", serviceUrl: "service_url", username: "username",
    vaultProvider: "vault_provider", vaultUrl: "vault_url", vaultReference: "vault_reference",
    twoFactorStatus: "two_factor_status", renewalDate: "renewal_date", notes: "notes", status: "status",
  };
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping) as Array<[keyof AccessRegistryInput, string]>) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`);
    values.push((input[key] ?? null) as string | number | null);
  }
  if (!fields.length) return current;
  return withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE access_registry_entries SET ${fields.join(", ")}
       WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
      [...values, organizationId, entryId],
    );
    const updated = await findWithConnection(connection, organizationId, entryId);
    if (!updated) throw new Error("Access entry could not be loaded after update.");
    await writeAudit(connection, organizationId, entryId, "UPDATED", current, updated);
    return updated;
  });
}
