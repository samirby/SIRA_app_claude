import { ok } from "@/core/http/api-response";
export const dynamic = "force-dynamic";
export async function GET() { return ok({ status: "alive" }); }
