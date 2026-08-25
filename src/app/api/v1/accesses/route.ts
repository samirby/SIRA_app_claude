import { fail, ok } from "@/core/http/api-response";
import { createAccessRegistryEntry, getAccessRegistryEntries } from "@/modules/access-registry/access-registry.service";
import type { AccessCategory, AccessScope, AccessStatus } from "@/modules/access-registry/access-registry.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return ok(await getAccessRegistryEntries({
      search: params.get("search") || undefined,
      category: (params.get("category") || undefined) as AccessCategory | undefined,
      scope: (params.get("scope") || undefined) as AccessScope | undefined,
      status: (params.get("status") || undefined) as AccessStatus | undefined,
    }));
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try { return ok(await createAccessRegistryEntry(await request.json()), 201); }
  catch (error) { return fail(error); }
}
