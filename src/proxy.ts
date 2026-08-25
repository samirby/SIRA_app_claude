import { NextRequest, NextResponse } from "next/server";
import { authIsConfigured, getAuthSettings, SESSION_COOKIE, verifySessionToken } from "@/core/auth/session";

const publicPaths = ["/login", "/api/v1/auth/login", "/api/v1/health/live", "/api/v1/health/ready"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.includes(pathname);
  const settings = getAuthSettings();
  const session = authIsConfigured() ? await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, settings.secret) : null;

  if (pathname === "/login" && session) return NextResponse.redirect(new URL(session.role === "CLIENT" ? "/portal" : "/", request.url));
  if (isPublic) return NextResponse.next();
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Duhet të kyçesh." } }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (session.role === "CLIENT" && !pathname.startsWith("/portal") && !pathname.startsWith("/api/v1/portal") && pathname !== "/api/v1/auth/logout" && pathname !== "/api/v1/auth/me") {
    if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Nuk ke qasje në këtë modul." } }, { status: 403 });
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  const adminOnly = ["/admin", "/settings", "/finance", "/invoices", "/contracts", "/accesses", "/platforms", "/ai", "/studio", "/products"];
  const adminApiOnly = ["/api/v1/admin", "/api/v1/labels", "/api/v1/releases", "/api/v1/accesses", "/api/v1/invoices", "/api/v1/products"];
  if (session.role === "WORKER" && (adminOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(`/api/v1${path}`)) || adminApiOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`)))) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Ky veprim kërkon Global Admin." } }, { status: 403 });
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sira-logo-black.svg|sira-logo.svg).*)"],
};
