const SESSION_COOKIE = "sira_session";

export type SessionRole = "GLOBAL_ADMIN" | "WORKER" | "CLIENT";
export interface SessionPayload {
  userId: number | null;
  email: string;
  name: string;
  role: SessionRole;
  clientId: number | null;
  exp: number;
}

function encode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return new Uint8Array([...binary].map((character) => character.charCodeAt(0)));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(payload: SessionPayload, secret: string) {
  const body = encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), new TextEncoder().encode(body));
  return `${body}.${encode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await signingKey(secret), decode(signature), new TextEncoder().encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(body))) as SessionPayload;
    if (!payload.email || !payload.name || !["GLOBAL_ADMIN", "WORKER", "CLIENT"].includes(payload.role) || !Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthSettings() {
  const email = process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.AUTH_ADMIN_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  const sessionHours = Math.min(168, Math.max(1, Number(process.env.AUTH_SESSION_HOURS) || 12));
  return { email, password, secret, sessionHours };
}

export function authIsConfigured() {
  const { email, password, secret } = getAuthSettings();
  return Boolean(email && password.length >= 8 && secret.length >= 32);
}

export { SESSION_COOKIE };
