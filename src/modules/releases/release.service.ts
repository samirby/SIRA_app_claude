import { listApplicationReleases } from "./release.repository";

export function getApplicationReleases() {
  return listApplicationReleases();
}
