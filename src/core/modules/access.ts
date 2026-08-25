import { ApiError } from "@/core/http/api-error";
import { getCapability } from "./registry";

export function requireCapability(code: string) {
  const capability = getCapability(code);

  if (!capability) {
    throw new ApiError(404, "Capability not found.", "CAPABILITY_NOT_FOUND");
  }

  if (capability.status !== "enabled") {
    throw new ApiError(
      403,
      "This capability is not enabled.",
      "CAPABILITY_DISABLED",
      { code, status: capability.status }
    );
  }

  return capability;
}
