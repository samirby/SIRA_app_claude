import { NextResponse } from "next/server";
import { ApiError } from "./api-error";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, meta: { timestamp: new Date().toISOString() } }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected error." } }, { status: 500 });
}
