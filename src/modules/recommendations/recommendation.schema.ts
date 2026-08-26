import { z } from "zod";

const nullableText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(10000).nullable().optional(),
);
const nullableId = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.number().int().positive().nullable().optional(),
);

const fields = {
  clientId: z.number().int().positive(),
  projectId: nullableId,
  title: z.string().trim().min(2).max(190),
  description: nullableText,
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional().default("PENDING"),
};

export const createRecommendationSchema = z.object(fields);

export const updateRecommendationSchema = z.object(
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.optional()])),
).refine((payload) => Object.keys(payload).length > 0, { message: "Nuk ka ndryshime për ruajtje." });
