import { AppShell } from "@/components/app-shell";
import { AccessRegistryManager } from "./access-registry-manager";

export default function Page() {
  return (
    <AppShell
      title="Qasjet & Kasaforta"
      subtitle="Organizo serverët, hosting-un, domain-et dhe lidhjet me kasafortën pa ruajtur password-a në SIRA."
    >
      <AccessRegistryManager />
    </AppShell>
  );
}
