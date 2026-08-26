export type RecommendationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface Recommendation {
  id: number;
  clientId: number;
  clientName: string | null;
  projectId: number | null;
  projectName: string | null;
  title: string;
  description: string | null;
  status: RecommendationStatus;
  taskId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationInput {
  clientId: number;
  projectId?: number | null;
  title: string;
  description?: string | null;
  status?: RecommendationStatus;
}

export interface RecommendationFilters {
  clientId?: number;
  projectId?: number;
  status?: RecommendationStatus;
}
