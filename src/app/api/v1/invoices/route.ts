import { fail, ok } from "@/core/http/api-response";
import { createInvoiceDraft, getInvoiceWorkspace } from "@/modules/invoices/invoice.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const value = Number(new URL(request.url).searchParams.get("clientId"));
    const clientId = Number.isInteger(value) && value > 0 ? value : undefined;
    return ok(await getInvoiceWorkspace(clientId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createInvoiceDraft(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}

