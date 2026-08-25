import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type { Client, ClientStatus, CreateClientInput } from "./client.types";

type ClientRow = RowDataPacket & {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address_line: string | null;
  company_name: string | null;
  client_type: "BUSINESS" | "PRIVATE";
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  tax_number: string | null;
  website: string | null;
  notes: string | null;
  status: ClientStatus;
  created_at: Date;
  updated_at: Date;
};

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address_line,
    companyName: row.company_name,
    clientType: row.client_type,
    city: row.city,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    taxNumber: row.tax_number,
    website: row.website,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listClients(
  organizationId: number,
  search = "",
  view: "active" | "archived" = "active",
): Promise<Client[]> {
  const query = `%${search}%`;
  const statusClause = view === "archived" ? "status = 'ARCHIVED'" : "status <> 'ARCHIVED'";
  const [rows] = await getDbPool().query<ClientRow[]>(
    `SELECT
       id, name, phone, email, address_line, company_name, client_type,
       city, postal_code, country_code, tax_number, website, notes,
       status, created_at, updated_at
     FROM clients
     WHERE organization_id = ?
       AND deleted_at IS NULL
       AND ${statusClause}
       AND (? = '' OR name LIKE ? OR phone LIKE ? OR email LIKE ? OR address_line LIKE ?)
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 200`,
    [organizationId, search, query, query, query, query],
  );

  return rows.map(mapClient);
}

export async function findClientById(
  organizationId: number,
  clientId: number,
): Promise<Client | null> {
  const [rows] = await getDbPool().query<ClientRow[]>(
    `SELECT
       id, name, phone, email, address_line, company_name, client_type,
       city, postal_code, country_code, tax_number, website, notes,
       status, created_at, updated_at
     FROM clients
     WHERE organization_id = ? AND id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [organizationId, clientId],
  );

  return rows[0] ? mapClient(rows[0]) : null;
}

export async function insertClient(
  organizationId: number,
  input: CreateClientInput,
): Promise<Client> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO clients
      (organization_id, name, phone, email, address_line, company_name, client_type,
       city, postal_code, country_code, tax_number, website, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [organizationId, input.name, input.phone ?? null, input.email ?? null, input.address ?? null,
      input.companyName ?? null, input.clientType ?? "PRIVATE", input.city ?? null,
      input.postalCode ?? null, input.countryCode ?? null, input.taxNumber ?? null,
      input.website ?? null, input.notes ?? null],
  );

  const client = await findClientById(organizationId, result.insertId);
  if (!client) throw new Error("Client was created but could not be loaded.");
  return client;
}

export async function updateClientRecord(
  organizationId: number,
  clientId: number,
  input: Record<string, unknown>,
): Promise<Client | null> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  const mapping: Record<string, string> = {
    name: "name", phone: "phone", email: "email", address: "address_line",
    companyName: "company_name", clientType: "client_type", city: "city",
    postalCode: "postal_code", countryCode: "country_code", taxNumber: "tax_number",
    website: "website", notes: "notes", status: "status",
  };

  for (const [key, column] of Object.entries(mapping)) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      fields.push(`${column} = ?`);
      const value = input[key];
      if (value !== null && typeof value !== "string" && typeof value !== "number") {
        throw new Error(`Unsupported SQL value for field: ${key}`);
      }
      values.push(value);
    }
  }

  if (fields.length === 0) return findClientById(organizationId, clientId);
  values.push(organizationId, clientId);

  await getDbPool().execute(
    `UPDATE clients SET ${fields.join(", ")}
     WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    values,
  );
  return findClientById(organizationId, clientId);
}

export async function permanentlyDeleteClientRecord(
  organizationId: number,
  clientId: number,
): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE clients
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE organization_id = ? AND id = ? AND status = 'ARCHIVED' AND deleted_at IS NULL`,
    [organizationId, clientId],
  );
  return result.affectedRows > 0;
}
