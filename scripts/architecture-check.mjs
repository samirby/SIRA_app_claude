import fs from "node:fs";

const required = [
  "src/core/modules/registry.ts",
  "src/core/events/event-bus.ts",
  "src/core/jobs/types.ts",
  "src/core/workflows/types.ts",
  "src/core/providers/ai-provider.ts",
  "src/localization/locales/sq/common.json",
  "src/localization/locales/de/common.json",
  "src/localization/locales/en/common.json",
  "docs/COMPLETE-PLATFORM-BLUEPRINT.md",
  "database/migrations/002_platform_capabilities.sql"
];

const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error("Missing architecture files:", missing);
  process.exit(1);
}
console.log("SIRA architecture foundation is complete.");
