import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type { ApplicationRelease, ReleaseChangeType } from "./release.types";

type ReleaseRow = RowDataPacket & {
  id: number;
  version: string;
  title: string;
  summary: string;
  release_channel: string;
  migration_name: string | null;
  installed_at: Date;
  change_id: number | null;
  change_type: ReleaseChangeType | null;
  change_description: string | null;
  change_order: number | null;
};

export async function listApplicationReleases(): Promise<ApplicationRelease[]> {
  const [rows] = await getDbPool().query<ReleaseRow[]>(
    `SELECT r.id, r.version, r.title, r.summary, r.release_channel, r.migration_name,
      r.installed_at, c.id AS change_id, c.change_type, c.description AS change_description,
      c.sort_order AS change_order
     FROM application_releases r
     LEFT JOIN application_release_changes c ON c.release_id = r.id
     ORDER BY r.installed_at DESC, r.id DESC, c.sort_order ASC, c.id ASC`,
  );

  const releases = new Map<number, ApplicationRelease>();
  for (const row of rows) {
    let release = releases.get(row.id);
    if (!release) {
      release = {
        id: row.id,
        version: row.version,
        title: row.title,
        summary: row.summary,
        channel: row.release_channel,
        migrationName: row.migration_name,
        installedAt: row.installed_at.toISOString(),
        changes: [],
      };
      releases.set(row.id, release);
    }
    if (row.change_id && row.change_type && row.change_description && row.change_order !== null) {
      release.changes.push({
        id: row.change_id,
        type: row.change_type,
        description: row.change_description,
        order: row.change_order,
      });
    }
  }

  return [...releases.values()];
}
