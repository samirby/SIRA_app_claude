import { z } from "zod";

const nullableText = (max: number) => z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(max).nullable().optional(),
);

const nullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
);

const fields = {
  clientId: z.number().int().positive(),
  productId: z.number().int().positive().nullable().optional(),
  projectType: z.enum(["WEBSITE", "IT", "GRAPHIC", "VIDEO", "MARKETING", "OTHER"]).default("WEBSITE"),
  name: z.string().trim().min(2).max(190),
  description: nullableText(10000),
  basePrice: z.number().min(0).max(10000000).default(0),
  vatRate: z.number().min(0).max(100).default(20),
  discountPercent: z.number().min(0).max(100).default(0),
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  startDate: nullableDate,
  dueDate: nullableDate,
  estimatedMinutes: z.number().int().min(0).max(10000000).default(0),
  costBudget: z.number().min(0).max(10000000).default(0),
  createTemplateTasks: z.boolean().optional().default(true),
};

export const createProjectSchema = z.object(fields).refine(
  (project) => !project.startDate || !project.dueDate || project.dueDate >= project.startDate,
  { message: "Afati nuk mund të jetë para datës së fillimit.", path: ["dueDate"] },
);

export const updateProjectSchema = z.object({
  ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.optional()])),
}).refine((payload) => Object.keys(payload).length > 0, { message: "Nuk ka ndryshime për ruajtje." });

export const projectBillingActionSchema = z.object({ action: z.enum(["DRAFT", "QUEUE", "NO_BILLING"]) });

export const projectDocumentSchema = z.object({
  name: z.string().trim().min(2).max(190),
  url: z.string().trim().url().max(2048),
  description: nullableText(500),
});

export const projectUpdateSchema = z.object({
  updateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updateType: z.enum(["UPDATE", "INFORMATION", "DECISION", "PROBLEM", "CLIENT_REQUEST"]).default("UPDATE"),
  title: z.string().trim().min(2).max(190),
  description: z.string().trim().min(2).max(10000),
});

const projectMilestoneFields = z.object({
  name: z.string().trim().min(2).max(190),
  description: nullableText(10000),
  status: z.enum(["PLANNED", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).default("PLANNED"),
  startDate: nullableDate,
  dueDate: nullableDate,
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const projectMilestoneSchema = projectMilestoneFields.refine((item) => !item.startDate || !item.dueDate || item.dueDate >= item.startDate, {
  message: "Afati i fazës nuk mund të jetë para datës së fillimit.", path: ["dueDate"],
});

export const projectMilestoneUpdateSchema = projectMilestoneFields.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: "Nuk ka ndryshime për ruajtje." },
);

export const projectBlockerSchema = z.object({
  title: z.string().trim().min(2).max(190),
  description: nullableText(10000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["OPEN", "RESOLVED"]).default("OPEN"),
  dueDate: nullableDate,
});

export const projectBlockerUpdateSchema = projectBlockerSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: "Nuk ka ndryshime për ruajtje." },
);

export const projectDocumentApprovalSchema = z.object({
  approvalStatus: z.enum(["NOT_REQUIRED", "DRAFT", "IN_REVIEW", "APPROVED"]),
});
