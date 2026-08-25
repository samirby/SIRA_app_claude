import { fail, ok } from "@/core/http/api-response";
import { createClient, getClients } from "@/modules/clients/client.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view") === "archived" ? "archived" : "active";
    return ok(await getClients(url.searchParams.get("search") ?? "", view));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createClient(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}
