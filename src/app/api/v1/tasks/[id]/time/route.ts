import { fail, ok } from "@/core/http/api-response";
import { addTaskTime } from "@/modules/tasks/task.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid task id.");
  return id;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await addTaskTime(parseId((await context.params).id), await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}

