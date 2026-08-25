export type ProjectStatus = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type ProjectType = "WEBSITE" | "IT" | "GRAPHIC" | "VIDEO" | "MARKETING" | "OTHER";
export type ProjectBillingStatus = "NOT_BILLABLE" | "NOT_READY" | "PENDING" | "DRAFTED" | "INVOICED";

export interface ProjectLabel {
  id: number;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  clientId: number | null;
  clientName: string | null;
  productId: number | null;
  productName: string | null;
  productDescription: string | null;
  projectType: ProjectType;
  name: string;
  description: string | null;
  basePrice: number;
  vatRate: number;
  discountPercent: number;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number;
  costBudget: number;
  billingStatus: ProjectBillingStatus;
  invoiceId: number | null;
  invoiceNumber: string | null;
  completedAt: string | null;
  taskCount: number;
  completedTaskCount: number;
  spentMinutes: number;
  internalCostTotal: number;
  billableExtraCostTotal: number;
  extraTaskNet: number;
  billingNet: number;
  billingTax: number;
  billingTotal: number;
  profit: number;
  profitMargin: number;
  labels: ProjectLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  clientId: number;
  productId?: number | null;
  productName?: string | null;
  productDescription?: string | null;
  projectType: ProjectType;
  name: string;
  description?: string | null;
  basePrice: number;
  vatRate: number;
  discountPercent: number;
  status: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes: number;
  costBudget: number;
  createTemplateTasks?: boolean;
}
