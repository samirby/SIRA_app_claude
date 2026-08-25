import { getDbPool } from "@/core/db/pool";
import { fail, ok } from "@/core/http/api-response";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await getDbPool().query("SELECT 1");
    return ok({ status: "ready", database: "connected" });
  } catch (e) { return fail(e); }
}
