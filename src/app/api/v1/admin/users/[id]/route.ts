import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/core/auth/password";
import { deleteManagedUser, updateManagedUser } from "@/modules/users/user.repository";

export const runtime = "nodejs";
const schema = z.object({ displayName: z.string().trim().min(2).max(160).optional(), status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]).optional(), role: z.enum(["GLOBAL_ADMIN", "WORKER", "CLIENT"]).optional(), clientId: z.number().int().positive().nullable().optional(), password: z.string().min(10).max(200).optional() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await context.params).id); const parsed = schema.safeParse(await request.json());
    if (!Number.isInteger(id) || id <= 0 || !parsed.success) return NextResponse.json({ ok: false, error: { message: "Të dhënat nuk janë valide." } }, { status: 400 });
    if (parsed.data.role === "CLIENT" && !parsed.data.clientId) return NextResponse.json({ ok: false, error: { message: "Roli Klient duhet të lidhet me një klient." } }, { status: 400 });
    const { password, ...input } = parsed.data;
    await updateManagedUser(1, id, { ...input, ...(password ? { passwordHash: await hashPassword(password) } : {}) });
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) { console.error(error); return NextResponse.json({ ok: false, error: { message: "Përdoruesi nuk mund të përditësohet." } }, { status: 500 }); }
}


export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await context.params).id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: { message: "ID-ja nuk është valide." } }, { status: 400 });
    const result = await deleteManagedUser(1, id);
    if (result === "NOT_FOUND") return NextResponse.json({ ok: false, error: { message: "Përdoruesi nuk u gjet." } }, { status: 404 });
    if (result === "LAST_GLOBAL_ADMIN") return NextResponse.json({ ok: false, error: { message: "Global Admin-i i fundit nuk mund të fshihet." } }, { status: 409 });
    return NextResponse.json({ ok: true, data: { id, deleted: true } });
  } catch (error) { console.error(error); return NextResponse.json({ ok: false, error: { message: "Përdoruesi nuk mund të fshihet." } }, { status: 500 }); }
}
