import { fail, ok } from "@/core/http/api-response";
import { removeProjectUpdate } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; updateId: string }> }) {
  try {
    const params = await context.params;
    return ok(await removeProjectUpdate(parseId(params.id), parseId(params.updateId)));
  } catch (error) { return fail(error); }
}
