import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";

export type UserRole = "GLOBAL_ADMIN" | "WORKER" | "CLIENT";
export interface ManagedUser { id: number; email: string; displayName: string; status: "ACTIVE" | "INACTIVE" | "LOCKED"; role: UserRole; clientId: number | null; clientName: string | null; createdAt: string; }
export interface AuthUser extends ManagedUser { passwordHash: string | null; }

type UserRow = RowDataPacket & { id: number; email: string; display_name: string; password_hash: string | null; status: "ACTIVE" | "INACTIVE" | "LOCKED"; role_code: UserRole; client_id: number | null; client_name: string | null; created_at: Date };

function map(row: UserRow): ManagedUser {
  return { id: row.id, email: row.email, displayName: row.display_name, status: row.status, role: row.role_code, clientId: row.client_id, clientName: row.client_name, createdAt: row.created_at.toISOString() };
}

const selectUsers = `SELECT u.id,u.email,u.display_name,u.password_hash,u.status,m.role_code,m.client_id,c.name AS client_name,u.created_at
 FROM users u INNER JOIN organization_memberships m ON m.user_id=u.id
 LEFT JOIN clients c ON c.id=m.client_id AND c.deleted_at IS NULL`;

export async function findAuthUserByEmail(organizationId: number, email: string): Promise<AuthUser | null> {
  const [rows] = await getDbPool().query<UserRow[]>(`${selectUsers} WHERE m.organization_id=? AND u.email=? AND u.deleted_at IS NULL LIMIT 1`, [organizationId, email]);
  return rows[0] ? { ...map(rows[0]), passwordHash: rows[0].password_hash } : null;
}

export async function listManagedUsers(organizationId: number): Promise<ManagedUser[]> {
  const [rows] = await getDbPool().query<UserRow[]>(`${selectUsers} WHERE m.organization_id=? AND u.deleted_at IS NULL ORDER BY u.created_at DESC`, [organizationId]);
  return rows.map(map);
}

export async function createManagedUser(organizationId: number, input: { email: string; displayName: string; passwordHash: string; role: UserRole; clientId: number | null }) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO users(email,display_name,password_hash,status) VALUES(?,?,?,'ACTIVE')`, [input.email, input.displayName, input.passwordHash]);
    await connection.execute(`INSERT INTO organization_memberships(organization_id,user_id,role_code,client_id) VALUES(?,?,?,?)`, [organizationId, result.insertId, input.role, input.clientId]);
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function updateManagedUser(organizationId: number, userId: number, input: { displayName?: string; status?: "ACTIVE" | "INACTIVE" | "LOCKED"; role?: UserRole; clientId?: number | null; passwordHash?: string }) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const fields: string[] = []; const values: Array<string | number | null> = [];
    if (input.displayName !== undefined) { fields.push("display_name=?"); values.push(input.displayName); }
    if (input.status !== undefined) { fields.push("status=?"); values.push(input.status); }
    if (input.passwordHash !== undefined) { fields.push("password_hash=?"); values.push(input.passwordHash); }
    if (fields.length) await connection.execute(`UPDATE users u INNER JOIN organization_memberships m ON m.user_id=u.id SET ${fields.map((field) => `u.${field}`).join(",")} WHERE u.id=? AND m.organization_id=?`, [...values, userId, organizationId]);
    if (input.role !== undefined || input.clientId !== undefined) {
      const membershipFields: string[] = []; const membershipValues: Array<string | number | null> = [];
      if (input.role !== undefined) { membershipFields.push("role_code=?"); membershipValues.push(input.role); }
      if (input.clientId !== undefined) { membershipFields.push("client_id=?"); membershipValues.push(input.clientId); }
      await connection.execute(`UPDATE organization_memberships SET ${membershipFields.join(",")} WHERE organization_id=? AND user_id=?`, [...membershipValues, organizationId, userId]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}


export async function deleteManagedUser(organizationId: number, userId: number): Promise<"DELETED" | "NOT_FOUND" | "LAST_GLOBAL_ADMIN"> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [membershipRows] = await connection.query<(RowDataPacket & { role_code: UserRole })[]>(
      `SELECT role_code FROM organization_memberships WHERE organization_id=? AND user_id=? LIMIT 1 FOR UPDATE`,
      [organizationId, userId],
    );
    const membership = membershipRows[0];
    if (!membership) { await connection.rollback(); return "NOT_FOUND"; }
    if (membership.role_code === "GLOBAL_ADMIN") {
      const [countRows] = await connection.query<(RowDataPacket & { total: number })[]>(
        `SELECT COUNT(*) AS total FROM organization_memberships m INNER JOIN users u ON u.id=m.user_id
         WHERE m.organization_id=? AND m.role_code='GLOBAL_ADMIN' AND u.deleted_at IS NULL`,
        [organizationId],
      );
      if (Number(countRows[0]?.total || 0) <= 1) { await connection.rollback(); return "LAST_GLOBAL_ADMIN"; }
    }
    await connection.execute(`DELETE FROM organization_memberships WHERE organization_id=? AND user_id=?`, [organizationId, userId]);
    await connection.execute(`UPDATE users SET status='INACTIVE', deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL`, [userId]);
    await connection.commit();
    return "DELETED";
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
