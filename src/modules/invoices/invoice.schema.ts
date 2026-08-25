import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createInvoiceDraftSchema = z.object({
  clientId: z.number().int().positive(),
  issueDate: date,
  dueDate: z.preprocess((value) => value === "" ? null : value, date.nullable().optional()),
  notes: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(10000).nullable().optional(),
  ),
  items: z.array(z.object({
    taskId: z.number().int().positive(),
    description: z.string().trim().min(1).max(500).optional(),
    quantity: z.number().positive().max(100000).optional(),
    unitPrice: z.number().min(0).max(10000000).optional(),
    vatRate: z.number().min(0).max(100).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
  })).min(1, "Zgjidh së paku një punë për faturim.").max(100),
}).superRefine((value, context) => {
  if (value.dueDate && value.dueDate < value.issueDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Afati i pagesës nuk mund të jetë para datës së faturës.", path: ["dueDate"] });
  }
  if (new Set(value.items.map((item) => item.taskId)).size !== value.items.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Një detyrë nuk mund të shtohet dy herë.", path: ["items"] });
  }
});

