import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthSettings, SESSION_COOKIE, verifySessionToken } from "@/core/auth/session";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, getAuthSettings().secret);
  if (!session) return NextResponse.json({ ok: false, error: { message: "Duhet të kyçesh." } }, { status: 401 });
  return NextResponse.json({ ok: true, data: session });
}
