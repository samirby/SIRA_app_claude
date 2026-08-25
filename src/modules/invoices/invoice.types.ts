export type InvoiceStatus = "DRAFT" | "FINALIZED" | "CANCELLED";

export interface Invoice {
  id: number;
  clientId: number;
  clientName: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  itemCount: number;
  finalizedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDraftItemInput {
  taskId: number;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  vatRate?: number;
  discountPercent?: number;
}

export interface InvoiceDraftInput {
  clientId: number;
  issueDate: string;
  dueDate?: string | null;
  notes?: string | null;
  items: InvoiceDraftItemInput[];
}

