import { fail, ok } from "@/core/http/api-response";
import { convertRecommendation } from "@/modules/recommendations/recommendation.service";

function parseId(value: string) { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid recommendation id."); return id; }

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return ok(await convertRecommendation(parseId((await context.params).id))); } catch (error) { return fail(error); }
}
