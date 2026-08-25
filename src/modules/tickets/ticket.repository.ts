import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";

export type TicketStatus = "NEW" | "IN_PROGRESS" | "WAITING_CLIENT" | "CLOSED";
export type TicketPriority = "NORMAL" | "HIGH" | "URGENT";

export interface TicketNote {
  id: number;
  authorRole: "GLOBAL_ADMIN" | "WORKER" | "CLIENT";
  authorName: string;
  note: string;
  createdAt: string;
}

export interface TicketRecord {
  id: number;
  ticketNumber: string;
  clientId: number;
  clientName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  dueAt: string | null;
  status: TicketStatus;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  closedAt: string | null;
  notes: TicketNote[];
}

type TicketRow = RowDataPacket & {
  id:number; ticket_number:string; client_id:number; client_name:string; title:string; description:string;
  priority:TicketPriority; due_at:Date|null; status:TicketStatus; resolution_notes:string|null;
  created_at:Date; updated_at:Date; accepted_at:Date|null; closed_at:Date|null;
};
type NoteRow = RowDataPacket & { id:number; ticket_id:number; author_role:TicketNote["authorRole"]; author_name:string; note:string; created_at:Date };

function iso(value: Date | null) { return value ? value.toISOString() : null; }

async function attachNotes(rows: TicketRow[]): Promise<TicketRecord[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const [noteRows] = await getDbPool().execute<NoteRow[]>(
    `SELECT id,ticket_id,author_role,author_name,note,created_at FROM ticket_notes WHERE ticket_id IN (${placeholders}) ORDER BY created_at ASC,id ASC`, ids,
  );
  const byTicket = new Map<number, TicketNote[]>();
  for (const row of noteRows) {
    const list = byTicket.get(row.ticket_id) ?? [];
    list.push({ id:row.id, authorRole:row.author_role, authorName:row.author_name, note:row.note, createdAt:row.created_at.toISOString() });
    byTicket.set(row.ticket_id, list);
  }
  return rows.map((row) => ({
    id:row.id, ticketNumber:row.ticket_number, clientId:row.client_id, clientName:row.client_name,
    title:row.title, description:row.description, priority:row.priority, dueAt:iso(row.due_at), status:row.status,
    resolutionNotes:row.resolution_notes, createdAt:row.created_at.toISOString(), updatedAt:row.updated_at.toISOString(),
    acceptedAt:iso(row.accepted_at), closedAt:iso(row.closed_at), notes:byTicket.get(row.id) ?? [],
  }));
}

const baseSelect = `SELECT t.id,t.ticket_number,t.client_id,c.name AS client_name,t.title,t.description,t.priority,t.due_at,t.status,t.resolution_notes,t.created_at,t.updated_at,t.accepted_at,t.closed_at
 FROM tickets t INNER JOIN clients c ON c.id=t.client_id AND c.organization_id=t.organization_id
 WHERE t.organization_id=? AND t.deleted_at IS NULL`;

export async function listTickets(organizationId:number, clientId?:number|null, search="") {
  const values:(string|number)[]=[organizationId];
  let sql=baseSelect;
  if (clientId) { sql += " AND t.client_id=?"; values.push(clientId); }
  if (search.trim()) { sql += " AND (t.ticket_number LIKE ? OR t.title LIKE ? OR c.name LIKE ?)"; const q=`%${search.trim()}%`; values.push(q,q,q); }
  sql += " ORDER BY FIELD(t.status,'NEW','IN_PROGRESS','WAITING_CLIENT','CLOSED'), t.updated_at DESC";
  const [rows]=await getDbPool().execute<TicketRow[]>(sql,values);
  return attachNotes(rows);
}

export async function findTicket(organizationId:number,id:number,clientId?:number|null) {
  const values:(number|string)[]=[organizationId,id];
  let sql=baseSelect+" AND t.id=?";
  if(clientId){sql+=" AND t.client_id=?";values.push(clientId);}
  sql+=" LIMIT 1";
  const [rows]=await getDbPool().execute<TicketRow[]>(sql,values);
  const mapped=await attachNotes(rows); return mapped[0]??null;
}

export async function createTicket(organizationId:number,input:{clientId:number;title:string;description:string;priority:TicketPriority;dueAt:string|null;createdByUserId:number|null;createdByRole:string}) {
  const connection=await getDbPool().getConnection();
  try{
    await connection.beginTransaction();
    const [result]=await connection.execute<ResultSetHeader>(`INSERT INTO tickets(organization_id,ticket_number,client_id,created_by_user_id,created_by_role,title,description,priority,due_at,status) VALUES(?, '', ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
      [organizationId,input.clientId,input.createdByUserId,input.createdByRole,input.title,input.description,input.priority,input.dueAt]);
    const number=`TIC-${new Date().getFullYear()}-${String(result.insertId).padStart(5,"0")}`;
    await connection.execute(`UPDATE tickets SET ticket_number=? WHERE id=?`,[number,result.insertId]);
    await connection.commit(); return result.insertId;
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}

export async function updateTicket(organizationId:number,id:number,input:{clientId?:number;title?:string;description?:string;status?:TicketStatus;priority?:TicketPriority;dueAt?:string|null;resolutionNotes?:string|null}){
  const current=await findTicket(organizationId,id); if(!current)return false;
  const fields:string[]=[]; const values:(string|number|null)[]=[];
  if(input.clientId!==undefined){fields.push("client_id=?");values.push(input.clientId);}
  if(input.title!==undefined){fields.push("title=?");values.push(input.title);}
  if(input.description!==undefined){fields.push("description=?");values.push(input.description);}
  if(input.priority!==undefined){fields.push("priority=?");values.push(input.priority);}
  if(input.dueAt!==undefined){fields.push("due_at=?");values.push(input.dueAt);}
  if(input.resolutionNotes!==undefined){fields.push("resolution_notes=?");values.push(input.resolutionNotes);}
  if(input.status!==undefined){
    fields.push("status=?");values.push(input.status);
    if(input.status==="IN_PROGRESS"&&current.status==="NEW") fields.push("accepted_at=COALESCE(accepted_at,CURRENT_TIMESTAMP)");
    if(input.status==="CLOSED") fields.push("closed_at=CURRENT_TIMESTAMP"); else fields.push("closed_at=NULL");
  }
  if(!fields.length)return true;
  values.push(id,organizationId);
  const [result]=await getDbPool().execute<ResultSetHeader>(`UPDATE tickets SET ${fields.join(", ")} WHERE id=? AND organization_id=? AND deleted_at IS NULL`,values);
  return result.affectedRows>0;
}

export async function softDeleteTicket(organizationId:number,id:number){
 const [result]=await getDbPool().execute<ResultSetHeader>(`UPDATE tickets SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=? AND deleted_at IS NULL`,[id,organizationId]);
 return result.affectedRows>0;
}

export async function addTicketNote(organizationId:number,ticketId:number,input:{authorUserId:number|null;authorRole:TicketNote["authorRole"];authorName:string;note:string}){
 const [result]=await getDbPool().execute<ResultSetHeader>(`INSERT INTO ticket_notes(organization_id,ticket_id,author_user_id,author_role,author_name,note) SELECT ?,t.id,?,?,?,? FROM tickets t WHERE t.id=? AND t.organization_id=? AND t.deleted_at IS NULL`,
 [organizationId,input.authorUserId,input.authorRole,input.authorName,input.note,ticketId,organizationId]);
 await getDbPool().execute(`UPDATE tickets SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=?`,[ticketId,organizationId]);
 return result.insertId;
}

export async function ticketDashboardStats(organizationId=1){
 const [rows]=await getDbPool().execute<(RowDataPacket&{status:TicketStatus;total:number})[]>(`SELECT status,COUNT(*) total FROM tickets WHERE organization_id=? AND deleted_at IS NULL GROUP BY status`,[organizationId]);
 const stats={NEW:0,IN_PROGRESS:0,WAITING_CLIENT:0,CLOSED:0}; for(const row of rows)stats[row.status]=Number(row.total); return stats;
}
