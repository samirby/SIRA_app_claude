import { fail, ok } from "@/core/http/api-response";
import { deleteProject, getProject, updateProject } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid project id.");
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await updateProject(parseId((await context.params).id), await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await getProject(parseId((await context.params).id)));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return ok(await deleteProject(parseId((await context.params).id)));
  } catch (error) {
    return fail(error);
  }
}
