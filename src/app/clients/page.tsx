import { AppShell } from "@/components/app-shell";
import { ClientManager } from "./client-manager";

export default function ClientsPage() {
  return (
    <AppShell
      title="Klientët"
      subtitle="Regjistrimi i shpejtë dhe menaxhimi i klientëve."
    >
      <ClientManager />
    </AppShell>
  );
}
