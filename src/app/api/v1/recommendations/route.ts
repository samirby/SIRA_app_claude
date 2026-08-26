import { fail, ok } from "@/core/http/api-response";
import { createRecommendation, getRecommendations } from "@/modules/recommendations/recommendation.service";
import type { RecommendationStatus } from "@/modules/recommendations/recommendation.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clientIdValue = Number(url.searchParams.get("clientId"));
    const projectIdValue = Number(url.searchParams.get("projectId"));
    return ok(await getRecommendations({
      clientId: Number.isInteger(clientIdValue) && clientIdValue > 0 ? clientIdValue : undefined,
      projectId: Number.isInteger(projectIdValue) && projectIdValue > 0 ? projectIdValue : undefined,
      status: (url.searchParams.get("status") || undefined) as RecommendationStatus | undefined,
    }));
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try { return ok(await createRecommendation(await request.json()), 201); } catch (error) { return fail(error); }
}
