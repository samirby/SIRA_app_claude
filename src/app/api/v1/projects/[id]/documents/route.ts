import { fail, ok } from "@/core/http/api-response";
import { addProjectDocumentFile } from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid project id.");
  return id;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await addProjectDocumentFile(parseId((await context.params).id), await request.formData()), 201); }
  catch (error) { return fail(error); }
}
