export type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "COMPLETED";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type BillingType = "FIXED" | "HOURLY";
export type TaskBillingStatus = "NOT_BILLABLE" | "NOT_READY" | "PENDING" | "DRAFTED" | "INVOICED";
export type TaskSubjectType = "CLIENT" | "PERSON";
export type ProjectTaskBillingType = "INCLUDED" | "EXTRA_BILLABLE" | "NON_BILLABLE";

export interface TaskSubtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface TaskHistoryEntry {
  id: number;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface TaskTimeEntry {
  id: number;
  workDate: string;
  startTime: string | null;
  endTime: string | null;
  minutes: number;
  note: string | null;
  createdAt: string;
}

export interface TaskNoteEntry {
  id: number;
  note: string;
  createdAt: string;
}

export interface TaskExtraCost {
  id: number;
  description: string;
  amount: number;
  costType: "INTERNAL" | "CLIENT";
  billableAmount: number;
  costDate: string;
  createdAt: string;
}

export interface TaskLabel {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  subjectType: TaskSubjectType;
  clientId: number | null;
  clientName: string | null;
  personName: string | null;
  subjectName: string;
  invoiceId: number | null;
  invoiceNumber: string | null;
  projectId: number | null;
  projectName: string | null;
  projectMilestoneId: number | null;
  projectMilestoneName: string | null;
  projectBillingType: ProjectTaskBillingType;
  title: string;
  description: string | null;
  assigneeName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number;
  spentMinutes: number;
  notes: string | null;
  billable: boolean;
  billingType: BillingType;
  invoiceDescription: string | null;
  quantity: number;
  unitPrice: number;
  hourlyCostRate: number;
  vatRate: number;
  discountPercent: number;
  billingStatus: TaskBillingStatus;
  billingTotal: number;
  billableExtraCostTotal: number;
  completedAt: string | null;
  invoiceQueuedAt: string | null;
  subtasks: TaskSubtask[];
  timeEntries: TaskTimeEntry[];
  noteEntries: TaskNoteEntry[];
  extraCosts: TaskExtraCost[];
  labels: TaskLabel[];
  history?: TaskHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  billingStatus?: TaskBillingStatus;
  clientId?: number;
  projectId?: number;
}

export interface TaskInput {
  subjectType: TaskSubjectType;
  clientId?: number | null;
  personName?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  projectMilestoneId?: number | null;
  projectBillingType?: ProjectTaskBillingType;
  title: string;
  description?: string | null;
  assigneeName?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes: number;
  spentMinutes?: number;
  notes?: string | null;
  billable: boolean;
  billingType: BillingType;
  invoiceDescription?: string | null;
  quantity: number;
  unitPrice: number;
  hourlyCostRate?: number;
  vatRate: number;
  discountPercent: number;
  subtasks?: Array<{ title: string; completed?: boolean }>;
  labelIds?: number[];
}

export interface TaskTimeInput {
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  hours?: number | null;
  note?: string | null;
}

export interface TaskExtraCostInput {
  description: string;
  amount: number;
  costType: "INTERNAL" | "CLIENT";
  billableAmount: number;
  costDate: string;
}
