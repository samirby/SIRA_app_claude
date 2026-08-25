import { fail, ok } from "@/core/http/api-response";
import {
  downloadProjectDocument,
  removeProjectDocument,
  updateProjectDocumentApproval,
} from "@/modules/projects/project.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id.");
  return id;
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const params = await context.params;
    return ok(await removeProjectDocument(parseId(params.id), parseId(params.documentId)));
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const params = await context.params;
    return ok(await updateProjectDocumentApproval(parseId(params.id), parseId(params.documentId), await request.json()));
  } catch (error) { return fail(error); }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const params = await context.params;
    const file = await downloadProjectDocument(parseId(params.id), parseId(params.documentId));
    return new Response(new Uint8Array(file.fileData), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) { return fail(error); }
}
