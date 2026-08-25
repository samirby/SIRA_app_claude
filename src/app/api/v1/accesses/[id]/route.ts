import { ApiError } from "@/core/http/api-error";
import { fail, ok } from "@/core/http/api-response";
import { getAccessRegistryEntry, updateAccessRegistryEntryService } from "@/modules/access-registry/access-registry.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "ID-ja nuk është valide.", "INVALID_ACCESS_ID");
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await getAccessRegistryEntry(parseId((await context.params).id))); }
  catch (error) { return fail(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await updateAccessRegistryEntryService(parseId((await context.params).id), await request.json())); }
  catch (error) { return fail(error); }
}
