import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/core/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true, data: { loggedOut: true } });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
  return response;
}
