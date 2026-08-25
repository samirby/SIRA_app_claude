import { z } from "zod";

const optionalText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(10000).nullable().optional(),
);
const itemList = z.array(z.string().trim().min(1).max(190)).max(100).optional().default([]);

const fields = {
  name: z.string().trim().min(2).max(190),
  category: z.string().trim().min(2).max(100),
  description: optionalText,
  elements: itemList,
  includes: itemList,
  basePrice: z.number().min(0).max(10000000),
  vatRate: z.number().min(0).max(100),
  billingCycle: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]),
  unitLabel: z.string().trim().min(1).max(60),
  templateTasks: itemList,
  active: z.boolean().optional().default(true),
};

export const createProductSchema = z.object(fields);
export const updateProductSchema = z.object({
  ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.optional()])),
}).refine((payload) => Object.keys(payload).length > 0, { message: "Nuk ka ndryshime për ruajtje." });
