import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSettings, SESSION_COOKIE, verifySessionToken } from "@/core/auth/session";
import { addTicketNote, findTicket } from "@/modules/tickets/ticket.repository";
async function session(){return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value,getAuthSettings().secret);}
const schema=z.object({note:z.string().trim().min(1).max(5000)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const s=await session();if(!s)return NextResponse.json({ok:false},{status:401});const id=Number((await params).id);const ticket=await findTicket(1,id,s.role==="CLIENT"?s.clientId:null);if(!ticket)return NextResponse.json({ok:false,error:{message:"Ticket-i nuk u gjet."}},{status:404});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({ok:false,error:{message:"Shkruaj një shënim."}},{status:400});const noteId=await addTicketNote(1,id,{authorUserId:s.userId,authorRole:s.role,authorName:s.name,note:parsed.data.note});return NextResponse.json({ok:true,data:{id:noteId}},{status:201});}
