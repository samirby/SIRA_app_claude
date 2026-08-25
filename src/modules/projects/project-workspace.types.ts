export interface ProjectDocument {
  id: number;
  name: string;
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  description: string | null;
  documentType: "DOCUMENT" | "DELIVERABLE";
  approvalStatus: "NOT_REQUIRED" | "DRAFT" | "IN_REVIEW" | "APPROVED";
  approvedAt: string | null;
  createdAt: string;
}

export interface ProjectUpdate {
  id: number;
  updateDate: string;
  updateType: "UPDATE" | "INFORMATION" | "DECISION" | "PROBLEM" | "CLIENT_REQUEST";
  title: string;
  description: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: number;
  name: string;
  description: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  startDate: string | null;
  dueDate: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBlocker {
  id: number;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivity {
  id: number;
  action: string;
  description: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProjectWorkspace {
  documents: ProjectDocument[];
  updates: ProjectUpdate[];
  milestones: ProjectMilestone[];
  blockers: ProjectBlocker[];
  activity: ProjectActivity[];
}
