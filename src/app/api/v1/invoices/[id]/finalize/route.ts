import { fail, ok } from "@/core/http/api-response";
import { finalizeInvoice } from "@/modules/invoices/invoice.service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await context.params).id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid invoice id.");
    return ok(await finalizeInvoice(id));
  } catch (error) {
    return fail(error);
  }
}
