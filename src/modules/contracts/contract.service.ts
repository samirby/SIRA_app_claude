import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { createContractSchema, updateContractSchema } from "./contract.schema";
import { findContractById, insertContract, listContracts, softDeleteContractRecord, updateContractRecord } from "./contract.repository";

export function getContracts() {
  return listContracts(getOrganizationContext().organizationId);
}

export async function getContract(contractId: number) {
  const contract = await findContractById(getOrganizationContext().organizationId, contractId);
  if (!contract) throw new ApiError(404, "Kontrata nuk u gjet.", "CONTRACT_NOT_FOUND");
  return contract;
}

export async function createContract(payload: unknown) {
  const parsed = createContractSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e kontratës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  return insertContract(getOrganizationContext().organizationId, parsed.data);
}

export async function updateContract(contractId: number, payload: unknown) {
  const parsed = updateContractSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e kontratës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getContract(contractId);
  const updated = await updateContractRecord(getOrganizationContext().organizationId, contractId, parsed.data);
  if (!updated) throw new ApiError(404, "Kontrata nuk u gjet.", "CONTRACT_NOT_FOUND");
  return updated;
}

export async function deleteContract(contractId: number) {
  await getContract(contractId);
  const deleted = await softDeleteContractRecord(getOrganizationContext().organizationId, contractId);
  if (!deleted) throw new ApiError(404, "Kontrata nuk u gjet.", "CONTRACT_NOT_FOUND");
  return { id: contractId, deleted: true };
}
