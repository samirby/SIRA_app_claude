import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type { Recommendation, RecommendationFilters, RecommendationInput, RecommendationStatus } from "./recommendation.types";

type RecommendationRow = RowDataPacket & {
  id: number;
  client_id: number;
  client_name: string | null;
  project_id: number | null;
  project_name: string | null;
  title: string;
  description: string | null;
  status: RecommendationStatus;
  task_id: number | null;
  created_at: Date;
  updated_at: Date;
};

function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    projectId: row.project_id,
    projectName: row.project_name,
    title: row.title,
    description: row.description,
    status: row.status,
    taskId: row.task_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const selectSql = `SELECT r.id, r.client_id, cl.name AS client_name, r.project_id, p.name AS project_name,
  r.title, r.description, r.status, r.task_id, r.created_at, r.updated_at
  FROM recommendations r
  LEFT JOIN clients cl ON cl.id = r.client_id AND cl.organization_id = r.organization_id
  LEFT JOIN projects p ON p.id = r.project_id AND p.organization_id = r.organization_id`;

export async function listRecommendations(organizationId: number, filters: RecommendationFilters = {}): Promise<Recommendation[]> {
  const conditions = ["r.organization_id = ?", "r.deleted_at IS NULL"];
  const params: Array<string | number> = [organizationId];
  if (filters.clientId) { conditions.push("r.client_id = ?"); params.push(filters.clientId); }
  if (filters.projectId) { conditions.push("r.project_id = ?"); params.push(filters.projectId); }
  if (filters.status) { conditions.push("r.status = ?"); params.push(filters.status); }
  const [rows] = await getDbPool().query<RecommendationRow[]>(
    `${selectSql} WHERE ${conditions.join(" AND ")} ORDER BY FIELD(r.status,'PENDING','ACCEPTED','DECLINED'), r.created_at DESC`,
    params,
  );
  return rows.map(mapRecommendation);
}

export async function findRecommendationById(organizationId: number, recommendationId: number): Promise<Recommendation | null> {
  const [rows] = await getDbPool().query<RecommendationRow[]>(
    `${selectSql} WHERE r.organization_id = ? AND r.id = ? AND r.deleted_at IS NULL LIMIT 1`,
    [organizationId, recommendationId],
  );
  return rows[0] ? mapRecommendation(rows[0]) : null;
}

export async function insertRecommendation(organizationId: number, input: RecommendationInput): Promise<Recommendation> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO recommendations (organization_id, client_id, project_id, title, description, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [organizationId, input.clientId, input.projectId ?? null, input.title, input.description ?? null, input.status ?? "PENDING"],
  );
  const created = await findRecommendationById(organizationId, result.insertId);
  if (!created) throw new Error("Recommendation was created but could not be loaded.");
  return created;
}

export async function updateRecommendationRecord(organizationId: number, recommendationId: number, input: Partial<RecommendationInput>) {
  const mapping: Record<string, string> = {
    clientId: "client_id", projectId: "project_id", title: "title", description: "description", status: "status",
  };
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`);
    values.push(input[key as keyof RecommendationInput] as string | number | null);
  }
  if (!fields.length) return findRecommendationById(organizationId, recommendationId);
  values.push(organizationId, recommendationId);
  await getDbPool().execute(
    `UPDATE recommendations SET ${fields.join(", ")} WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    values,
  );
  return findRecommendationById(organizationId, recommendationId);
}

export async function setRecommendationTaskRecord(organizationId: number, recommendationId: number, taskId: number, status: RecommendationStatus) {
  await getDbPool().execute(
    `UPDATE recommendations SET task_id = ?, status = ? WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [taskId, status, organizationId, recommendationId],
  );
  return findRecommendationById(organizationId, recommendationId);
}

export async function softDeleteRecommendationRecord(organizationId: number, recommendationId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE recommendations SET deleted_at = CURRENT_TIMESTAMP WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [organizationId, recommendationId],
  );
  return result.affectedRows > 0;
}
