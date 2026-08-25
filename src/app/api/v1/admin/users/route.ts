import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/core/auth/password";
import { createManagedUser, listManagedUsers } from "@/modules/users/user.repository";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  displayName: z.string().trim().min(2).max(160),
  password: z.string().min(10).max(200),
  role: z.enum(["GLOBAL_ADMIN", "WORKER", "CLIENT"]),
  clientId: z.number().int().positive().nullable(),
}).refine((value) => value.role !== "CLIENT" || value.clientId, { message: "Roli Klient duhet të lidhet me një klient.", path: ["clientId"] });

export async function GET() {
  try { return NextResponse.json({ ok: true, data: await listManagedUsers(1) }); }
  catch (error) { console.error(error); return NextResponse.json({ ok: false, error: { message: "Përdoruesit nuk mund të ngarkohen." } }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: { message: parsed.error.issues[0]?.message || "Të dhënat nuk janë valide." } }, { status: 400 });
    const id = await createManagedUser(1, { ...parsed.data, clientId: parsed.data.role === "CLIENT" ? parsed.data.clientId : null, passwordHash: await hashPassword(parsed.data.password) });
    return NextResponse.json({ ok: true, data: { id } }, { status: 201 });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
    return NextResponse.json({ ok: false, error: { message: duplicate ? "Ky email ekziston." : "Përdoruesi nuk mund të krijohet." } }, { status: duplicate ? 409 : 500 });
  }
}
