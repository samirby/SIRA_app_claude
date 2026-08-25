import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null).nullable().optional();

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().email("Emaili nuk është valid.").nullable().optional(),
);

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Emri duhet të ketë së paku 2 karaktere.").max(160),
  phone: optionalText(50),
  email: optionalEmail,
  address: optionalText(255),
  companyName: optionalText(160),
  clientType: z.enum(["BUSINESS", "PRIVATE"]).default("PRIVATE"),
  city: optionalText(120),
  postalCode: optionalText(20),
  countryCode: optionalText(2),
  taxNumber: optionalText(80),
  website: optionalText(190),
  notes: optionalText(5000),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(2, "Emri duhet të ketë së paku 2 karaktere.").max(160).optional(),
  phone: optionalText(50),
  email: optionalEmail,
  address: optionalText(255),
  companyName: optionalText(160),
  clientType: z.enum(["BUSINESS", "PRIVATE"]).optional(),
  city: optionalText(120),
  postalCode: optionalText(20),
  countryCode: optionalText(2),
  taxNumber: optionalText(80),
  website: optionalText(190),
  notes: optionalText(5000),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "Nuk ka të dhëna për përditësim.",
});
