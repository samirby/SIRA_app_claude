import { fail, ok } from "@/core/http/api-response";
import { removeProjectMilestone, updateProjectMilestone } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; milestoneId: string }> }) {
  try {
    const params = await context.params;
    return ok(await updateProjectMilestone(parseId(params.id), parseId(params.milestoneId), await request.json()));
  } catch (error) { return fail(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; milestoneId: string }> }) {
  try {
    const params = await context.params;
    return ok(await removeProjectMilestone(parseId(params.id), parseId(params.milestoneId)));
  } catch (error) { return fail(error); }
}
