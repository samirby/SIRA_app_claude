import { fail, ok } from "@/core/http/api-response";
import { createTask, getTasks } from "@/modules/tasks/task.service";
import type { TaskBillingStatus, TaskPriority, TaskStatus } from "@/modules/tasks/task.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clientIdValue = Number(url.searchParams.get("clientId"));
    const projectIdValue = Number(url.searchParams.get("projectId"));
    return ok(await getTasks({
      search: url.searchParams.get("search")?.trim() || undefined,
      status: (url.searchParams.get("status") || undefined) as TaskStatus | undefined,
      priority: (url.searchParams.get("priority") || undefined) as TaskPriority | undefined,
      billingStatus: (url.searchParams.get("billingStatus") || undefined) as TaskBillingStatus | undefined,
      clientId: Number.isInteger(clientIdValue) && clientIdValue > 0 ? clientIdValue : undefined,
      projectId: Number.isInteger(projectIdValue) && projectIdValue > 0 ? projectIdValue : undefined,
    }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createTask(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}
