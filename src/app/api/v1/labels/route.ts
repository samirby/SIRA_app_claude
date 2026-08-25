import { fail, ok } from "@/core/http/api-response";
import { createLabel, getLabels } from "@/modules/tasks/task.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getLabels());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createLabel(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}

