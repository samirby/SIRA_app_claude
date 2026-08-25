import { fail, ok } from "@/core/http/api-response";
import { queueTaskForBilling } from "@/modules/tasks/task.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid task id.");
  return id;
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await queueTaskForBilling(parseId((await context.params).id), true));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await queueTaskForBilling(parseId((await context.params).id), false));
  } catch (error) {
    return fail(error);
  }
}
