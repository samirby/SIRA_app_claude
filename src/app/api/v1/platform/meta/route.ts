import { ok } from "@/core/http/api-response";
import { capabilityRegistry } from "@/core/modules/registry";
import { APP_VERSION, RELEASE_CHANNEL } from "@/core/version";

export async function GET() {
  return ok({
    name: "SIRA Platform",
    version: APP_VERSION,
    releaseChannel: RELEASE_CHANNEL,
    locales: ["sq", "de", "en"],
    capabilities: capabilityRegistry.map(({ code, kind, status, version, dependencies }) => ({
      code, kind, status, version, dependencies: dependencies ?? []
    }))
  });
}
