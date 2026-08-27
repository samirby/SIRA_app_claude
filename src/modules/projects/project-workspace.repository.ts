import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type {
  ProjectActivity,
  ProjectBlocker,
  ProjectDocument,
  ProjectMilestone,
  ProjectUpdate,
  ProjectWorkspace,
} from "./project-workspace.types";

type DocumentRow = RowDataPacket & {
  id: number; name: string; url: string | null; file_name: string | null; mime_type: string | null;
  file_size: number | null; file_data?: Buffer | null; description: string | null;
  document_type: ProjectDocument["documentType"]; approval_status: ProjectDocument["approvalStatus"];
  approved_at: Date | null; created_at: Date;
};
type UpdateRow = RowDataPacket & {
  id: number; update_date: string | Date; update_type: ProjectUpdate["updateType"];
  title: string; description: string; created_at: Date;
};
type MilestoneRow = RowDataPacket & {
  id: number; name: string; description: string | null; status: ProjectMilestone["status"];
  start_date: string | Date | null; due_date: string | Date | null; sort_order: number;
  completed_at: Date | null; created_at: Date; updated_at: Date;
};
type BlockerRow = RowDataPacket & {
  id: number; title: string; description: string | null; severity: ProjectBlocker["severity"];
  status: ProjectBlocker["status"]; due_date: string | Date | null; resolved_at: Date | null;
  created_at: Date; updated_at: Date;
};
type ActivityRow = RowDataPacket & {
  id: number; action: string; description: string; details: string | Record<string, unknown> | null; created_at: Date;
};
type MilestoneIdentityRow = RowDataPacket & { id: number; project_id: number; name: string; status: ProjectMilestone["status"] };

export interface ProjectDocumentFile { fileName: string; mimeType: string; fileData: Buffer; }

function dateOnly(value: string | Date | null) {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}
function parseDetails(value: ActivityRow["details"]): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}
function mapDocument(row: DocumentRow): ProjectDocument {
  return {
    id: row.id, name: row.name, url: row.url, fileName: row.file_name, mimeType: row.mime_type,
    fileSize: row.file_size, description: row.description, documentType: row.document_type,
    approvalStatus: row.approval_status, approvedAt: row.approved_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listProjectWorkspaceRecords(organizationId: number, projectId: number): Promise<ProjectWorkspace> {
  const [documentResult, updateResult, milestoneResult, blockerResult, activityResult] = await Promise.all([
    getDbPool().query<DocumentRow[]>(
      `SELECT id, name, url, file_name, mime_type, file_size, description, document_type,
        approval_status, approved_at, created_at FROM project_documents
       WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC, id DESC`, [organizationId, projectId]),
    getDbPool().query<UpdateRow[]>(
      `SELECT id, update_date, update_type, title, description, created_at FROM project_updates
       WHERE organization_id = ? AND project_id = ? ORDER BY update_date DESC, id DESC`, [organizationId, projectId]),
    getDbPool().query<MilestoneRow[]>(
      `SELECT id, name, description, status, start_date, due_date, sort_order, completed_at, created_at, updated_at
       FROM project_milestones WHERE organization_id = ? AND project_id = ?
       ORDER BY sort_order, COALESCE(start_date, due_date), id`, [organizationId, projectId]),
    getDbPool().query<BlockerRow[]>(
      `SELECT id, title, description, severity, status, due_date, resolved_at, created_at, updated_at
       FROM project_blockers WHERE organization_id = ? AND project_id = ?
       ORDER BY FIELD(status,'OPEN','RESOLVED'), FIELD(severity,'HIGH','MEDIUM','LOW'), created_at DESC`, [organizationId, projectId]),
    getDbPool().query<ActivityRow[]>(
      `SELECT id, action, description, details, created_at FROM project_activity
       WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC, id DESC LIMIT 200`, [organizationId, projectId]),
  ]);

  const documents = documentResult[0].map(mapDocument);
  const updates: ProjectUpdate[] = updateResult[0].map((row) => ({
    id: row.id, updateDate: dateOnly(row.update_date) || "", updateType: row.update_type,
    title: row.title, description: row.description, createdAt: row.created_at.toISOString(),
  }));
  const milestones: ProjectMilestone[] = milestoneResult[0].map((row) => ({
    id: row.id, name: row.name, description: row.description, status: row.status,
    startDate: dateOnly(row.start_date), dueDate: dateOnly(row.due_date), sortOrder: Number(row.sort_order),
    completedAt: row.completed_at?.toISOString() ?? null, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  }));
  const blockers: ProjectBlocker[] = blockerResult[0].map((row) => ({
    id: row.id, title: row.title, description: row.description, severity: row.severity, status: row.status,
    dueDate: dateOnly(row.due_date), resolvedAt: row.resolved_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  }));
  const activity: ProjectActivity[] = activityResult[0].map((row) => ({
    id: row.id, action: row.action, description: row.description, details: parseDetails(row.details), createdAt: row.created_at.toISOString(),
  }));
  return { documents, updates, milestones, blockers, activity };
}

export async function findProjectMilestoneRecord(organizationId: number, milestoneId: number) {
  const [rows] = await getDbPool().query<MilestoneIdentityRow[]>(
    `SELECT id, project_id, name, status FROM project_milestones
     WHERE organization_id = ? AND id = ? LIMIT 1`,
    [organizationId, milestoneId],
  );
  const row = rows[0];
  return row ? { id: row.id, projectId: row.project_id, name: row.name, status: row.status } : null;
}

export async function insertProjectActivity(
  organizationId: number, projectId: number, action: string, description: string,
  details: Record<string, unknown> | null = null,
) {
  try {
    await getDbPool().execute(
      `INSERT INTO project_activity (organization_id, project_id, action, description, details) VALUES (?, ?, ?, ?, ?)`,
      [organizationId, projectId, action, description, details ? JSON.stringify(details) : null]);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_NO_SUCH_TABLE") return;
    throw error;
  }
}

export async function insertProjectDocumentRecord(
  organizationId: number, projectId: number,
  input: { name: string; url: string; description?: string | null },
): Promise<ProjectWorkspace> {
  await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_documents (organization_id, project_id, name, url, description) VALUES (?, ?, ?, ?, ?)`,
    [organizationId, projectId, input.name, input.url, input.description ?? null]);
  await insertProjectActivity(organizationId, projectId, "DOCUMENT_ADDED", `Dokumenti “${input.name}” u shtua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function insertProjectDocumentFileRecord(
  organizationId: number, projectId: number,
  input: { name: string; description: string | null; fileName: string; mimeType: string; fileSize: number; fileData: Buffer; documentType: ProjectDocument["documentType"] },
): Promise<ProjectWorkspace> {
  const approvalStatus = input.documentType === "DELIVERABLE" ? "DRAFT" : "NOT_REQUIRED";
  await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_documents
       (organization_id, project_id, name, url, file_name, mime_type, file_size, file_data, description, document_type, approval_status)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, projectId, input.name, input.fileName, input.mimeType, input.fileSize, input.fileData,
      input.description, input.documentType, approvalStatus]);
  await insertProjectActivity(organizationId, projectId, input.documentType === "DELIVERABLE" ? "DELIVERABLE_ADDED" : "DOCUMENT_ADDED",
    `${input.documentType === "DELIVERABLE" ? "Rezultati" : "Dokumenti"} “${input.name}” u ngarkua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function updateProjectDocumentApprovalRecord(
  organizationId: number, projectId: number, documentId: number, approvalStatus: ProjectDocument["approvalStatus"],
): Promise<ProjectWorkspace | null> {
  const approvedAt = approvalStatus === "APPROVED" ? new Date() : null;
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE project_documents SET approval_status = ?, approved_at = ?
     WHERE organization_id = ? AND project_id = ? AND id = ? AND document_type = 'DELIVERABLE'`,
    [approvalStatus, approvedAt, organizationId, projectId, documentId]);
  if (!result.affectedRows) return null;
  await insertProjectActivity(organizationId, projectId, "DELIVERABLE_STATUS_CHANGED", `Statusi i rezultatit u ndryshua në ${approvalStatus}.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function getProjectDocumentFileRecord(organizationId: number, projectId: number, documentId: number): Promise<ProjectDocumentFile | null> {
  const [rows] = await getDbPool().query<DocumentRow[]>(
    `SELECT id, name, url, file_name, mime_type, file_size, file_data, description, document_type,
      approval_status, approved_at, created_at FROM project_documents
     WHERE organization_id = ? AND project_id = ? AND id = ? LIMIT 1`, [organizationId, projectId, documentId]);
  const row = rows[0];
  if (!row?.file_data || !row.file_name) return null;
  return { fileName: row.file_name, mimeType: row.mime_type || "application/octet-stream", fileData: row.file_data };
}

export async function deleteProjectDocumentRecord(organizationId: number, projectId: number, documentId: number): Promise<ProjectWorkspace | null> {
  const [rows] = await getDbPool().query<DocumentRow[]>(
    `SELECT id, name, url, file_name, mime_type, file_size, description, document_type, approval_status, approved_at, created_at
     FROM project_documents WHERE organization_id = ? AND project_id = ? AND id = ? LIMIT 1`, [organizationId, projectId, documentId]);
  if (!rows[0]) return null;
  await getDbPool().execute("DELETE FROM project_documents WHERE organization_id = ? AND project_id = ? AND id = ?", [organizationId, projectId, documentId]);
  await insertProjectActivity(organizationId, projectId, "DOCUMENT_DELETED", `Dokumenti “${rows[0].name}” u largua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function insertProjectUpdateRecord(
  organizationId: number, projectId: number,
  input: { updateDate: string; updateType: ProjectUpdate["updateType"]; title: string; description: string },
): Promise<ProjectWorkspace> {
  await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_updates (organization_id, project_id, update_date, update_type, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
    [organizationId, projectId, input.updateDate, input.updateType, input.title, input.description]);
  await insertProjectActivity(organizationId, projectId, "UPDATE_ADDED", `Përditësimi “${input.title}” u shtua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function deleteProjectUpdateRecord(organizationId: number, projectId: number, updateId: number): Promise<ProjectWorkspace | null> {
  const [rows] = await getDbPool().query<UpdateRow[]>(
    `SELECT id, update_date, update_type, title, description, created_at FROM project_updates
     WHERE organization_id = ? AND project_id = ? AND id = ? LIMIT 1`, [organizationId, projectId, updateId]);
  if (!rows[0]) return null;
  await getDbPool().execute("DELETE FROM project_updates WHERE organization_id = ? AND project_id = ? AND id = ?", [organizationId, projectId, updateId]);
  await insertProjectActivity(organizationId, projectId, "UPDATE_DELETED", `Përditësimi “${rows[0].title}” u largua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function insertProjectMilestoneRecord(
  organizationId: number, projectId: number,
  input: { name: string; description?: string | null; status: ProjectMilestone["status"]; startDate?: string | null; dueDate?: string | null; sortOrder: number },
): Promise<ProjectWorkspace> {
  const completedAt = input.status === "COMPLETED" ? new Date() : null;
  const [insertResult] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_milestones (organization_id, project_id, name, description, status, start_date, due_date, sort_order, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, projectId, input.name, input.description ?? null, input.status, input.startDate ?? null,
      input.dueDate ?? null, input.sortOrder, completedAt]);
  if (input.status === "IN_PROGRESS" || input.status === "COMPLETED") {
    await getDbPool().execute<ResultSetHeader>(
      `UPDATE project_milestones pm SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
       WHERE pm.organization_id = ? AND pm.project_id = ? AND pm.id <> ? AND pm.status <> 'COMPLETED' AND pm.sort_order < ?
         AND NOT EXISTS (
           SELECT 1 FROM tasks t WHERE t.organization_id = pm.organization_id
             AND t.project_milestone_id = pm.id AND t.status <> 'COMPLETED' AND t.deleted_at IS NULL
         )`,
      [organizationId, projectId, insertResult.insertId, input.sortOrder]);
  }
  await insertProjectActivity(organizationId, projectId, "MILESTONE_ADDED", `Faza “${input.name}” u shtua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function insertProjectTemplateMilestoneRecord(
  organizationId: number,
  projectId: number,
  input: { name: string; description?: string | null; status: ProjectMilestone["status"]; startDate?: string | null; dueDate?: string | null; sortOrder: number },
): Promise<number> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_milestones (organization_id, project_id, name, description, status, start_date, due_date, sort_order, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [organizationId, projectId, input.name, input.description ?? null, input.status,
      input.startDate ?? null, input.dueDate ?? null, input.sortOrder],
  );
  return result.insertId;
}

export async function updateProjectMilestoneRecord(
  organizationId: number, projectId: number, milestoneId: number,
  input: Partial<{ name: string; description: string | null; status: ProjectMilestone["status"]; startDate: string | null; dueDate: string | null; sortOrder: number }>,
): Promise<ProjectWorkspace | null> {
  const mapping: Record<string, string> = { name: "name", description: "description", status: "status", startDate: "start_date", dueDate: "due_date", sortOrder: "sort_order" };
  const fields: string[] = []; const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`); values.push(input[key as keyof typeof input] ?? null);
  }
  if (input.status) { fields.push(input.status === "COMPLETED" ? "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)" : "completed_at = NULL"); }
  if (!fields.length) return listProjectWorkspaceRecords(organizationId, projectId);
  values.push(organizationId, projectId, milestoneId);
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE project_milestones SET ${fields.join(", ")} WHERE organization_id = ? AND project_id = ? AND id = ?`, values);
  if (!result.affectedRows) return null;
  if (input.status === "IN_PROGRESS" || input.status === "COMPLETED") {
    const [autoCompleted] = await getDbPool().execute<ResultSetHeader>(
      `UPDATE project_milestones pm SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
       WHERE pm.organization_id = ? AND pm.project_id = ? AND pm.id <> ? AND pm.status <> 'COMPLETED'
         AND pm.sort_order < (SELECT sort_order FROM (SELECT sort_order FROM project_milestones WHERE organization_id = ? AND project_id = ? AND id = ?) AS current_milestone)
         AND NOT EXISTS (
           SELECT 1 FROM tasks t WHERE t.organization_id = pm.organization_id
             AND t.project_milestone_id = pm.id AND t.status <> 'COMPLETED' AND t.deleted_at IS NULL
         )`,
      [organizationId, projectId, milestoneId, organizationId, projectId, milestoneId]);
    if (autoCompleted.affectedRows) {
      await insertProjectActivity(organizationId, projectId, "MILESTONE_UPDATED", "Fazat paraprake u shënuan automatikisht si të përfunduara.");
    }
  }
  await insertProjectActivity(organizationId, projectId, "MILESTONE_UPDATED", "Faza e projektit u përditësua.");
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function deleteProjectMilestoneRecord(organizationId: number, projectId: number, milestoneId: number): Promise<ProjectWorkspace | null> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    "DELETE FROM project_milestones WHERE organization_id = ? AND project_id = ? AND id = ?", [organizationId, projectId, milestoneId]);
  if (!result.affectedRows) return null;
  await insertProjectActivity(organizationId, projectId, "MILESTONE_DELETED", "Faza e projektit u largua.");
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function insertProjectBlockerRecord(
  organizationId: number, projectId: number,
  input: { title: string; description?: string | null; severity: ProjectBlocker["severity"]; status: ProjectBlocker["status"]; dueDate?: string | null },
): Promise<ProjectWorkspace> {
  const resolvedAt = input.status === "RESOLVED" ? new Date() : null;
  await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO project_blockers (organization_id, project_id, title, description, severity, status, due_date, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, projectId, input.title, input.description ?? null, input.severity, input.status, input.dueDate ?? null, resolvedAt]);
  await insertProjectActivity(organizationId, projectId, "BLOCKER_ADDED", `Pengesa “${input.title}” u shtua.`);
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function updateProjectBlockerRecord(
  organizationId: number, projectId: number, blockerId: number,
  input: Partial<{ title: string; description: string | null; severity: ProjectBlocker["severity"]; status: ProjectBlocker["status"]; dueDate: string | null }>,
): Promise<ProjectWorkspace | null> {
  const mapping: Record<string, string> = { title: "title", description: "description", severity: "severity", status: "status", dueDate: "due_date" };
  const fields: string[] = []; const values: Array<string | number | null> = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    fields.push(`${column} = ?`); values.push(input[key as keyof typeof input] ?? null);
  }
  if (input.status) { fields.push(input.status === "RESOLVED" ? "resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP)" : "resolved_at = NULL"); }
  if (!fields.length) return listProjectWorkspaceRecords(organizationId, projectId);
  values.push(organizationId, projectId, blockerId);
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE project_blockers SET ${fields.join(", ")} WHERE organization_id = ? AND project_id = ? AND id = ?`, values);
  if (!result.affectedRows) return null;
  await insertProjectActivity(organizationId, projectId, "BLOCKER_UPDATED", "Pengesa e projektit u përditësua.");
  return listProjectWorkspaceRecords(organizationId, projectId);
}

export async function deleteProjectBlockerRecord(organizationId: number, projectId: number, blockerId: number): Promise<ProjectWorkspace | null> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    "DELETE FROM project_blockers WHERE organization_id = ? AND project_id = ? AND id = ?", [organizationId, projectId, blockerId]);
  if (!result.affectedRows) return null;
  await insertProjectActivity(organizationId, projectId, "BLOCKER_DELETED", "Pengesa e projektit u largua.");
  return listProjectWorkspaceRecords(organizationId, projectId);
}
