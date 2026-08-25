import { fail, ok } from "@/core/http/api-response";
import { getProjectWorkspace } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid project id.");
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await getProjectWorkspace(parseId((await context.params).id))); }
  catch (error) { return fail(error); }
}
