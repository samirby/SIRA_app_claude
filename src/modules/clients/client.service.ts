import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import {
  findClientById,
  insertClient,
  listClients,
  permanentlyDeleteClientRecord,
  updateClientRecord,
} from "./client.repository";
import { createClientSchema, updateClientSchema } from "./client.schema";

export async function getClients(search = "", view: "active" | "archived" = "active") {
  const organization = getOrganizationContext();
  return listClients(organization.organizationId, search.trim(), view);
}

export async function getClient(clientId: number) {
  const organization = getOrganizationContext();
  const client = await findClientById(organization.organizationId, clientId);
  if (!client) throw new ApiError(404, "Klienti nuk u gjet.", "CLIENT_NOT_FOUND");
  return client;
}

export async function createClient(payload: unknown) {
  const parsed = createClientSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e klientit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  const organization = getOrganizationContext();
  return insertClient(organization.organizationId, parsed.data);
}

export async function updateClient(clientId: number, payload: unknown) {
  const parsed = updateClientSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e klientit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  const organization = getOrganizationContext();
  const updated = await updateClientRecord(organization.organizationId, clientId, parsed.data);
  if (!updated) throw new ApiError(404, "Klienti nuk u gjet.", "CLIENT_NOT_FOUND");
  return updated;
}

export async function permanentlyDeleteClient(clientId: number, payload: unknown) {
  const confirmName = typeof payload === "object" && payload !== null && "confirmName" in payload
    ? String((payload as { confirmName?: unknown }).confirmName ?? "").trim()
    : "";
  const client = await getClient(clientId);
  if (client.status !== "ARCHIVED") {
    throw new ApiError(409, "Klienti duhet të arkivohet para fshirjes përfundimtare.", "CLIENT_NOT_ARCHIVED");
  }
  if (confirmName !== client.name) {
    throw new ApiError(400, "Emri i shkruar nuk përputhet me emrin e klientit.", "CONFIRMATION_MISMATCH");
  }
  const organization = getOrganizationContext();
  const deleted = await permanentlyDeleteClientRecord(organization.organizationId, clientId);
  if (!deleted) throw new ApiError(404, "Klienti nuk u gjet.", "CLIENT_NOT_FOUND");
  return { deleted: true, id: clientId };
}
