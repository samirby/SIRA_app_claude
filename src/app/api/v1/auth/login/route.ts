import { NextResponse } from "next/server";
import { authIsConfigured, createSessionToken, getAuthSettings, SESSION_COOKIE } from "@/core/auth/session";
import { verifyPassword } from "@/core/auth/password";
import { findAuthUserByEmail } from "@/modules/users/user.repository";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

async function equal(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(left)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(right)),
  ]);
  const a = new Uint8Array(leftHash); const b = new Uint8Array(rightHash);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}

export async function POST(request: Request) {
  if (!authIsConfigured()) {
    return NextResponse.json({ ok: false, error: { message: "Login-i nuk është konfiguruar në server." } }, { status: 503 });
  }
  const key = requestKey(request);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ ok: false, error: { message: "Shumë tentativa. Provo përsëri pas 15 minutash." } }, { status: 429 });
  }
  try {
    const body = await request.json() as { email?: string; password?: string; remember?: boolean };
    const settings = getAuthSettings();
    const normalizedEmail = body.email?.trim().toLowerCase() ?? "";
    const envLogin = await equal(normalizedEmail, settings.email) && await equal(body.password ?? "", settings.password);
    const databaseUser = envLogin ? null : await findAuthUserByEmail(1, normalizedEmail);
    const databaseLogin = Boolean(databaseUser && databaseUser.status === "ACTIVE" && await verifyPassword(body.password ?? "", databaseUser.passwordHash));
    if (!envLogin && !databaseLogin) {
      attempts.set(key, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: now + 15 * 60 * 1000 });
      return NextResponse.json({ ok: false, error: { message: "Email-i ose password-i nuk është i saktë." } }, { status: 401 });
    }
    attempts.delete(key);
    const hours = body.remember ? Math.min(168, settings.sessionHours * 7) : settings.sessionHours;
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    const identity = envLogin
      ? { userId: null, email: settings.email, name: "Samir Bytyqi", role: "GLOBAL_ADMIN" as const, clientId: null }
      : { userId: databaseUser!.id, email: databaseUser!.email, name: databaseUser!.displayName, role: databaseUser!.role, clientId: databaseUser!.clientId };
    const token = await createSessionToken({ ...identity, exp: expiresAt }, settings.secret);
    const response = NextResponse.json({ ok: true, data: { ...identity, redirectTo: identity.role === "CLIENT" ? "/portal" : "/" } });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(expiresAt) });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: { message: "Kërkesa për login nuk është valide." } }, { status: 400 });
  }
}
