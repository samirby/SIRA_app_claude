export type JobStatus = "pending" | "processing" | "completed" | "failed" | "retrying" | "cancelled";

export interface BackgroundJob<T = unknown> {
  id: string;
  type: string;
  organizationId: number;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: string;
  createdAt: string;
}
