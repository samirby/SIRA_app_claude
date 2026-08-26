import { fail, ok } from "@/core/http/api-response";
import { deleteRecommendation, getRecommendation, updateRecommendation } from "@/modules/recommendations/recommendation.service";

function parseId(value: string) { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid recommendation id."); return id; }

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await getRecommendation(parseId((await context.params).id))); } catch (error) { return fail(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await updateRecommendation(parseId((await context.params).id), await request.json())); } catch (error) { return fail(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await deleteRecommendation(parseId((await context.params).id))); } catch (error) { return fail(error); }
}
