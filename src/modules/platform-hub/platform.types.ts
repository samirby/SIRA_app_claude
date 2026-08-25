export type PlatformEnvironment = "development" | "staging" | "production";
export type PlatformStatus = "online" | "degraded" | "maintenance" | "offline" | "unknown";

export interface ConnectedPlatform {
  id: number;
  organizationId: number;
  code: string;
  name: string;
  type: string;
  baseUrl: string;
  environment: PlatformEnvironment;
  version: string;
  status: PlatformStatus;
  lastSeenAt?: string;
  repositoryUrl?: string;
  activeBranch?: string;
}
