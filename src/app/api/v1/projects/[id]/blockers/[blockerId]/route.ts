import { fail, ok } from "@/core/http/api-response";
import { removeProjectBlocker, updateProjectBlocker } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; blockerId: string }> }) {
  try {
    const params = await context.params;
    return ok(await updateProjectBlocker(parseId(params.id), parseId(params.blockerId), await request.json()));
  } catch (error) { return fail(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; blockerId: string }> }) {
  try {
    const params = await context.params;
    return ok(await removeProjectBlocker(parseId(params.id), parseId(params.blockerId)));
  } catch (error) { return fail(error); }
}
