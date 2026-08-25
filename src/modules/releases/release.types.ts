export type ReleaseChangeType = "FEATURE" | "IMPROVEMENT" | "FIX" | "SECURITY" | "DATABASE";

export interface ReleaseChange {
  id: number;
  type: ReleaseChangeType;
  description: string;
  order: number;
}

export interface ApplicationRelease {
  id: number;
  version: string;
  title: string;
  summary: string;
  channel: string;
  migrationName: string | null;
  installedAt: string;
  changes: ReleaseChange[];
}
