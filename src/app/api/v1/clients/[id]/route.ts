import { fail, ok } from "@/core/http/api-response";
import { getClient, permanentlyDeleteClient, updateClient } from "@/modules/clients/client.service";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid client ID.");
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await getClient(parseId(id)));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await updateClient(parseId(id), await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await permanentlyDeleteClient(parseId(id), await request.json()));
  } catch (error) {
    return fail(error);
  }
}
