export type CapabilityStatus =
  | "enabled"
  | "disabled"
  | "hidden"
  | "coming_soon"
  | "maintenance";

export type CapabilityKind =
  | "core"
  | "module"
  | "addon"
  | "integration"
  | "automation"
  | "platform";

export interface CapabilityDefinition {
  code: string;
  nameKey: string;
  descriptionKey: string;
  kind: CapabilityKind;
  status: CapabilityStatus;
  version: string;
  route?: string;
  dependencies?: string[];
  permissions?: string[];
  navigation?: {
    group: "primary" | "more" | "settings" | "hidden";
    order: number;
  };
}
