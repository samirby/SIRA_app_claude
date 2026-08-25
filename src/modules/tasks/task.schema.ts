import { z } from "zod";

const nullableText = (max: number) => z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(max).nullable().optional(),
);

const nullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
);

const baseTaskFields = {
  subjectType: z.enum(["CLIENT", "PERSON"]),
  clientId: z.number().int().positive().nullable().optional(),
  personName: nullableText(160),
  projectId: z.number().int().positive().nullable().optional(),
  projectName: nullableText(180),
  projectMilestoneId: z.number().int().positive().nullable().optional(),
  projectBillingType: z.enum(["INCLUDED", "EXTRA_BILLABLE", "NON_BILLABLE"]).optional().default("NON_BILLABLE"),
  title: z.string().trim().min(2, "Titulli duhet të ketë së paku 2 karaktere.").max(190),
  description: nullableText(10000),
  assigneeName: nullableText(160),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  status: z.enum(["NEW", "IN_PROGRESS", "WAITING", "COMPLETED"]),
  startDate: nullableDate,
  dueDate: nullableDate,
  estimatedMinutes: z.number().int().min(0).max(600000),
  spentMinutes: z.number().int().min(0).max(600000).optional().default(0),
  notes: nullableText(20000),
  billable: z.boolean(),
  billingType: z.enum(["FIXED", "HOURLY"]),
  invoiceDescription: nullableText(500),
  quantity: z.number().positive().max(100000),
  unitPrice: z.number().min(0).max(10000000),
  hourlyCostRate: z.number().min(0).max(100000).optional().default(0),
  vatRate: z.number().min(0).max(100),
  discountPercent: z.number().min(0).max(100),
  subtasks: z.array(z.object({
    title: z.string().trim().min(1).max(190),
    completed: z.boolean().optional().default(false),
  })).max(50).optional(),
  labelIds: z.array(z.number().int().positive()).max(20).optional(),
};

export const createTaskSchema = z.object(baseTaskFields)
  .refine(
    (task) => !task.startDate || !task.dueDate || task.dueDate >= task.startDate,
    { message: "Afati nuk mund të jetë para datës së fillimit.", path: ["dueDate"] },
  )
  .refine(
    (task) => task.subjectType === "CLIENT" ? Boolean(task.clientId) : Boolean(task.personName),
    { message: "Zgjidh klientin ose shkruaj emrin e personit.", path: ["subjectType"] },
  );

export const updateTaskSchema = z.object({
  ...Object.fromEntries(Object.entries(baseTaskFields).map(([key, value]) => [key, value.optional()])),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "Nuk ka të dhëna për përditësim.",
});

export const taskTimeSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.preprocess((value) => value === "" ? null : value, z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()),
  endTime: z.preprocess((value) => value === "" ? null : value, z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()),
  hours: z.number().positive().max(24).nullable().optional(),
  note: nullableText(500),
}).superRefine((entry, context) => {
  const hasRange = Boolean(entry.startTime && entry.endTime);
  const hasHours = typeof entry.hours === "number";
  if (hasRange === hasHours) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Vendos intervalin ose numrin e orëve.", path: ["hours"] });
  }
  if (hasRange && entry.startTime! >= entry.endTime!) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Ora e përfundimit duhet të jetë pas fillimit.", path: ["endTime"] });
  }
});

export const taskNoteSchema = z.object({ note: z.string().trim().min(2).max(20000) });

export const taskExtraCostSchema = z.object({
  description: z.string().trim().min(2).max(190),
  amount: z.number().positive().max(10000000),
  costType: z.enum(["INTERNAL", "CLIENT"]),
  billableAmount: z.number().min(0).max(10000000),
  costDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).superRefine((value, context) => {
  if (value.costType === "CLIENT" && value.billableAmount <= 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["billableAmount"], message: "Vendos shumën për faturim." });
  }
  if (value.costType === "INTERNAL" && value.billableAmount !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["billableAmount"], message: "Kostoja e brendshme nuk faturohet." });
  }
});

export const labelSchema = z.object({
  name: z.string().trim().min(2).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
