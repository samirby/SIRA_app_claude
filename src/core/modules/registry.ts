import type { CapabilityDefinition } from "./types";

export const capabilityRegistry: CapabilityDefinition[] = [
  {
    code: "core.platform",
    nameKey: "modules.core.name",
    descriptionKey: "modules.core.description",
    kind: "core",
    status: "enabled",
    version: "0.3.0",
    navigation: { group: "hidden", order: 0 }
  },
  {
    code: "clients",
    nameKey: "modules.clients.name",
    descriptionKey: "modules.clients.description",
    kind: "module",
    status: "enabled",
    version: "0.9.0",
    route: "/clients",
    permissions: ["clients.read", "clients.write"],
    navigation: { group: "primary", order: 10 }
  },
  {
    code: "projects",
    nameKey: "modules.projects.name",
    descriptionKey: "modules.projects.description",
    kind: "module",
    status: "enabled",
    version: "0.9.9",
    route: "/projects",
    dependencies: ["clients"],
    permissions: ["projects.read", "projects.write"],
    navigation: { group: "primary", order: 20 }
  },
  {
    code: "tasks",
    nameKey: "modules.tasks.name",
    descriptionKey: "modules.tasks.description",
    kind: "module",
    status: "enabled",
    version: "0.9.9",
    route: "/tasks",
    dependencies: ["clients"],
    permissions: ["tasks.read", "tasks.write"],
    navigation: { group: "primary", order: 30 }
  },
  {
    code: "products",
    nameKey: "modules.products.name",
    descriptionKey: "modules.products.description",
    kind: "module",
    status: "enabled",
    version: "0.9.9",
    route: "/products",
    permissions: ["products.read", "products.write"],
    navigation: { group: "more", order: 40 }
  },
  {
    code: "invoices",
    nameKey: "modules.invoices.name",
    descriptionKey: "modules.invoices.description",
    kind: "module",
    status: "enabled",
    version: "0.8.0",
    route: "/invoices",
    dependencies: ["clients", "tasks"],
    permissions: ["invoices.read", "invoices.write"],
    navigation: { group: "more", order: 50 }
  },
  {
    code: "access.vault",
    nameKey: "modules.accessVault.name",
    descriptionKey: "modules.accessVault.description",
    kind: "module",
    status: "enabled",
    version: "0.10.0",
    route: "/accesses",
    dependencies: ["clients"],
    permissions: ["accesses.read", "accesses.write"],
    navigation: { group: "more", order: 60 }
  },
  {
    code: "invoices.pdf",
    nameKey: "addons.invoicePdf.name",
    descriptionKey: "addons.invoicePdf.description",
    kind: "addon",
    status: "disabled",
    version: "0.1.0",
    dependencies: ["invoices"]
  },
  {
    code: "invoices.email",
    nameKey: "addons.invoiceEmail.name",
    descriptionKey: "addons.invoiceEmail.description",
    kind: "addon",
    status: "disabled",
    version: "0.1.0",
    dependencies: ["invoices", "invoices.pdf", "integration.email"]
  },
  {
    code: "integration.email",
    nameKey: "integrations.email.name",
    descriptionKey: "integrations.email.description",
    kind: "integration",
    status: "disabled",
    version: "0.1.0"
  },
  {
    code: "ai.core",
    nameKey: "modules.ai.name",
    descriptionKey: "modules.ai.description",
    kind: "module",
    status: "disabled",
    version: "0.1.0",
    route: "/ai",
    permissions: ["ai.use"],
    navigation: { group: "more", order: 90 }
  },
  {
    code: "platform.hub",
    nameKey: "platforms.hub.name",
    descriptionKey: "platforms.hub.description",
    kind: "platform",
    status: "coming_soon",
    version: "0.1.0",
    route: "/platforms",
    permissions: ["platforms.read", "platforms.manage"],
    navigation: { group: "more", order: 100 }
  },
  {
    code: "app.studio",
    nameKey: "platforms.studio.name",
    descriptionKey: "platforms.studio.description",
    kind: "platform",
    status: "coming_soon",
    version: "0.1.0",
    route: "/studio",
    permissions: ["studio.read", "studio.manage"],
    navigation: { group: "more", order: 110 }
  }
];

export function getCapability(code: string) {
  return capabilityRegistry.find((item) => item.code === code);
}

export function isCapabilityAvailable(code: string) {
  const item = getCapability(code);
  return item?.status === "enabled";
}
