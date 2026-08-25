import { z } from "zod";

const optionalText = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(max).nullable().optional(),
);

const optionalUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(500).url("URL-ja nuk është valide.").refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    "Lejohen vetëm URL me HTTP ose HTTPS.",
  ).nullable().optional(),
);

const optionalDate = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
);

const fields = {
  clientId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2, "Emri duhet të ketë së paku 2 karaktere.").max(190),
  category: z.enum(["SERVER", "HOSTING", "DOMAIN", "NETWORK", "CLOUD", "DATABASE", "EMAIL", "APPLICATION", "SOCIAL", "OTHER"]),
  scope: z.enum(["PERSONAL", "SIRA", "CLIENT"]),
  provider: optionalText(160),
  address: optionalText(255),
  serviceUrl: optionalUrl,
  username: optionalText(190),
  vaultProvider: z.enum(["BITWARDEN", "VAULTWARDEN", "ONEPASSWORD", "KEEPASS", "OTHER"]).nullable().optional(),
  vaultUrl: optionalUrl,
  vaultReference: optionalText(190),
  twoFactorStatus: z.enum(["ENABLED", "DISABLED", "UNKNOWN"]),
  renewalDate: optionalDate,
  notes: optionalText(10000),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
};

export const createAccessRegistrySchema = z.object(fields).superRefine((entry, context) => {
  if (entry.scope === "CLIENT" && !entry.clientId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Zgjidh klientin.", path: ["clientId"] });
  }
  if (entry.vaultUrl && !entry.vaultProvider) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Zgjidh kasafortën.", path: ["vaultProvider"] });
  }
});

export const updateAccessRegistrySchema = z.object({
  clientId: fields.clientId,
  name: fields.name.optional(),
  category: fields.category.optional(),
  scope: fields.scope.optional(),
  provider: fields.provider,
  address: fields.address,
  serviceUrl: fields.serviceUrl,
  username: fields.username,
  vaultProvider: fields.vaultProvider,
  vaultUrl: fields.vaultUrl,
  vaultReference: fields.vaultReference,
  twoFactorStatus: fields.twoFactorStatus.optional(),
  renewalDate: fields.renewalDate,
  notes: fields.notes,
  status: fields.status.optional(),
}).refine((payload) => Object.keys(payload).length > 0, { message: "Nuk ka ndryshime për ruajtje." });
