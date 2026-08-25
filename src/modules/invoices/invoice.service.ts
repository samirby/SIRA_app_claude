import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { listTasks } from "@/modules/tasks/task.repository";
import { createInvoiceDraftSchema } from "./invoice.schema";
import {
  cancelInvoiceRecord,
  createInvoiceDraftRecord,
  finalizeInvoiceRecord,
  findInvoiceById,
  listInvoices,
} from "./invoice.repository";

export async function getInvoiceWorkspace(clientId?: number) {
  const organizationId = getOrganizationContext().organizationId;
  const [invoices, pendingTasks] = await Promise.all([
    listInvoices(organizationId, clientId),
    listTasks(organizationId, { clientId, billingStatus: "PENDING" }).then((tasks) => tasks.filter((task) => !task.projectId)),
  ]);
  return { invoices, pendingTasks };
}

export async function createInvoiceDraft(payload: unknown) {
  const parsed = createInvoiceDraftSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e faturës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  return createInvoiceDraftRecord(getOrganizationContext().organizationId, parsed.data);
}

export async function finalizeInvoice(invoiceId: number) {
  const organizationId = getOrganizationContext().organizationId;
  const changed = await finalizeInvoiceRecord(organizationId, invoiceId);
  if (!changed) throw new ApiError(409, "Vetëm një draft mund të finalizohet.", "INVOICE_STATUS_CONFLICT");
  const invoice = await findInvoiceById(organizationId, invoiceId);
  if (!invoice) throw new ApiError(404, "Fatura nuk u gjet.", "INVOICE_NOT_FOUND");
  return invoice;
}

export async function cancelInvoice(invoiceId: number) {
  const organizationId = getOrganizationContext().organizationId;
  const changed = await cancelInvoiceRecord(organizationId, invoiceId);
  if (!changed) throw new ApiError(409, "Fatura është anuluar më parë ose nuk ekziston.", "INVOICE_STATUS_CONFLICT");
  const invoice = await findInvoiceById(organizationId, invoiceId);
  if (!invoice) throw new ApiError(404, "Fatura nuk u gjet.", "INVOICE_NOT_FOUND");
  return invoice;
}
