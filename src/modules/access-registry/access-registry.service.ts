import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { getClient } from "@/modules/clients/client.service";
import { createAccessRegistrySchema, updateAccessRegistrySchema } from "./access-registry.schema";
import { findAccessRegistryEntry, insertAccessRegistryEntry, listAccessRegistryEntries, updateAccessRegistryEntry } from "./access-registry.repository";
import type { AccessRegistryFilters, AccessRegistryInput } from "./access-registry.types";

function normalizeInput(input: AccessRegistryInput): AccessRegistryInput {
  return { ...input, clientId: input.scope === "CLIENT" ? input.clientId ?? null : null };
}

async function validateRelation(input: AccessRegistryInput) {
  if (input.scope === "CLIENT") {
    if (!input.clientId) throw new ApiError(400, "Zgjidh klientin.", "ACCESS_CLIENT_REQUIRED");
    await getClient(input.clientId);
  }
  if (input.vaultUrl && !input.vaultProvider) {
    throw new ApiError(400, "Zgjidh kasafortën për lidhjen e ruajtur.", "VAULT_PROVIDER_REQUIRED");
  }
}

export function getAccessRegistryEntries(filters: AccessRegistryFilters = {}) {
  return listAccessRegistryEntries(getOrganizationContext().organizationId, filters);
}

export async function getAccessRegistryEntry(entryId: number) {
  const entry = await findAccessRegistryEntry(getOrganizationContext().organizationId, entryId);
  if (!entry) throw new ApiError(404, "Qasja nuk u gjet.", "ACCESS_ENTRY_NOT_FOUND");
  return entry;
}

export async function createAccessRegistryEntry(payload: unknown) {
  const parsed = createAccessRegistrySchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e qasjes nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  const input = normalizeInput(parsed.data);
  await validateRelation(input);
  return insertAccessRegistryEntry(getOrganizationContext().organizationId, input);
}

export async function updateAccessRegistryEntryService(entryId: number, payload: unknown) {
  const parsed = updateAccessRegistrySchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e qasjes nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  const current = await getAccessRegistryEntry(entryId);
  const merged = normalizeInput({
    clientId: Object.prototype.hasOwnProperty.call(parsed.data, "clientId") ? parsed.data.clientId : current.clientId,
    name: parsed.data.name ?? current.name,
    category: parsed.data.category ?? current.category,
    scope: parsed.data.scope ?? current.scope,
    provider: Object.prototype.hasOwnProperty.call(parsed.data, "provider") ? parsed.data.provider : current.provider,
    address: Object.prototype.hasOwnProperty.call(parsed.data, "address") ? parsed.data.address : current.address,
    serviceUrl: Object.prototype.hasOwnProperty.call(parsed.data, "serviceUrl") ? parsed.data.serviceUrl : current.serviceUrl,
    username: Object.prototype.hasOwnProperty.call(parsed.data, "username") ? parsed.data.username : current.username,
    vaultProvider: Object.prototype.hasOwnProperty.call(parsed.data, "vaultProvider") ? parsed.data.vaultProvider : current.vaultProvider,
    vaultUrl: Object.prototype.hasOwnProperty.call(parsed.data, "vaultUrl") ? parsed.data.vaultUrl : current.vaultUrl,
    vaultReference: Object.prototype.hasOwnProperty.call(parsed.data, "vaultReference") ? parsed.data.vaultReference : current.vaultReference,
    twoFactorStatus: parsed.data.twoFactorStatus ?? current.twoFactorStatus,
    renewalDate: Object.prototype.hasOwnProperty.call(parsed.data, "renewalDate") ? parsed.data.renewalDate : current.renewalDate,
    notes: Object.prototype.hasOwnProperty.call(parsed.data, "notes") ? parsed.data.notes : current.notes,
    status: parsed.data.status ?? current.status,
  });
  await validateRelation(merged);
  return updateAccessRegistryEntry(getOrganizationContext().organizationId, entryId, merged, current);
}
