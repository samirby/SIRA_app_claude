import { fail, ok } from "@/core/http/api-response";
import { deleteLabel, updateLabel } from "@/modules/tasks/task.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    return ok(await updateLabel(parseId(params.id), await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    return ok(await deleteLabel(parseId(params.id)));
  } catch (error) {
    return fail(error);
  }
}
