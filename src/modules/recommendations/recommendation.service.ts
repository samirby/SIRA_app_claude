import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { createTask } from "@/modules/tasks/task.service";
import { createRecommendationSchema, updateRecommendationSchema } from "./recommendation.schema";
import {
  findRecommendationById,
  insertRecommendation,
  listRecommendations,
  setRecommendationTaskRecord,
  softDeleteRecommendationRecord,
  updateRecommendationRecord,
} from "./recommendation.repository";
import type { RecommendationFilters } from "./recommendation.types";

export function getRecommendations(filters: RecommendationFilters = {}) {
  return listRecommendations(getOrganizationContext().organizationId, filters);
}

export async function getRecommendation(recommendationId: number) {
  const recommendation = await findRecommendationById(getOrganizationContext().organizationId, recommendationId);
  if (!recommendation) throw new ApiError(404, "Rekomandimi nuk u gjet.", "RECOMMENDATION_NOT_FOUND");
  return recommendation;
}

export async function createRecommendation(payload: unknown) {
  const parsed = createRecommendationSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e rekomandimit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  return insertRecommendation(getOrganizationContext().organizationId, parsed.data);
}

export async function updateRecommendation(recommendationId: number, payload: unknown) {
  const parsed = updateRecommendationSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e rekomandimit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getRecommendation(recommendationId);
  const updated = await updateRecommendationRecord(getOrganizationContext().organizationId, recommendationId, parsed.data);
  if (!updated) throw new ApiError(404, "Rekomandimi nuk u gjet.", "RECOMMENDATION_NOT_FOUND");
  return updated;
}

export async function deleteRecommendation(recommendationId: number) {
  await getRecommendation(recommendationId);
  const deleted = await softDeleteRecommendationRecord(getOrganizationContext().organizationId, recommendationId);
  if (!deleted) throw new ApiError(404, "Rekomandimi nuk u gjet.", "RECOMMENDATION_NOT_FOUND");
  return { id: recommendationId, deleted: true };
}

export async function convertRecommendation(recommendationId: number) {
  const recommendation = await getRecommendation(recommendationId);
  if (recommendation.status !== "PENDING") {
    throw new ApiError(400, "Vetëm rekomandimet në pritje mund të kthehen në detyrë.", "RECOMMENDATION_NOT_PENDING");
  }
  const task = await createTask({
    subjectType: "CLIENT",
    clientId: recommendation.clientId,
    projectId: recommendation.projectId ?? null,
    projectBillingType: "NON_BILLABLE",
    title: `Rekomandim: ${recommendation.title}`,
    description: recommendation.description ?? null,
    priority: "NORMAL",
    status: "NEW",
    estimatedMinutes: 0,
    spentMinutes: 0,
    billable: false,
    billingType: "HOURLY",
    quantity: 1,
    unitPrice: 0,
    vatRate: 0,
    discountPercent: 0,
  });
  const updated = await setRecommendationTaskRecord(getOrganizationContext().organizationId, recommendationId, task.id, "ACCEPTED");
  if (!updated) throw new ApiError(404, "Rekomandimi nuk u gjet.", "RECOMMENDATION_NOT_FOUND");
  return updated;
}

export async function declineRecommendation(recommendationId: number) {
  await getRecommendation(recommendationId);
  const updated = await updateRecommendationRecord(getOrganizationContext().organizationId, recommendationId, { status: "DECLINED" });
  if (!updated) throw new ApiError(404, "Rekomandimi nuk u gjet.", "RECOMMENDATION_NOT_FOUND");
  return updated;
}
