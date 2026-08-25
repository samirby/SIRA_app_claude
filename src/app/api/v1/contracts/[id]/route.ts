import { fail, ok } from "@/core/http/api-response";
import { deleteContract, updateContract } from "@/modules/contracts/contract.service";
function parseId(value: string) { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid contract id."); return id; }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await updateContract(parseId((await context.params).id), await request.json())); } catch (error) { return fail(error); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await deleteContract(parseId((await context.params).id))); } catch (error) { return fail(error); }
}
