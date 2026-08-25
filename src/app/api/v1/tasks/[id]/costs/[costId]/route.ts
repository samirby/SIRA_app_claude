import { fail, ok } from "@/core/http/api-response";
import { deleteTaskExtraCost } from "@/modules/tasks/task.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; costId: string }> }) {
  try {
    const params = await context.params;
    return ok(await deleteTaskExtraCost(parseId(params.id), parseId(params.costId)));
  } catch (error) {
    return fail(error);
  }
}
