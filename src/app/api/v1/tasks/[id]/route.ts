import { fail, ok } from "@/core/http/api-response";
import { deleteTask, getTask, updateTask } from "@/modules/tasks/task.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid task id.");
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await getTask(parseId((await context.params).id)));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await updateTask(parseId((await context.params).id), await request.json()));
  } catch (error) {
    return fail(error);
  }
}


export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await deleteTask(parseId((await context.params).id)));
  } catch (error) {
    return fail(error);
  }
}
