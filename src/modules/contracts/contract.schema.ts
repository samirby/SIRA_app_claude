import { z } from "zod";

const nullableText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(10000).nullable().optional(),
);
const nullableId = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.number().int().positive().nullable().optional(),
);
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const fields = {
  ownerType: z.enum(["CLIENT", "COMPANY"]),
  clientId: nullableId,
  productId: nullableId,
  title: z.string().trim().min(2).max(190),
  category: z.string().trim().min(2).max(120),
  provider: nullableText,
  reference: nullableText,
  startDate: dateText,
  endDate: z.preprocess((value) => value === "" ? null : value, dateText.nullable().optional()),
  price: z.number().min(0).max(10000000),
  cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  reminderDays: z.number().int().min(0).max(3650),
  cancellationNoticeDays: z.number().int().min(0).max(3650),
  autoRenew: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]),
  description: nullableText,
  notes: nullableText,
};

export const createContractSchema = z.object(fields).superRefine((data, ctx) => {
  if (data.ownerType === "CLIENT" && !data.clientId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["clientId"], message: "Zgjidh klientin." });
  }
  if (data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Data e skadimit nuk mund të jetë para fillimit." });
  }
});

export const updateContractSchema = z.object(
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.optional()])),
).refine((payload) => Object.keys(payload).length > 0, { message: "Nuk ka ndryshime për ruajtje." });
