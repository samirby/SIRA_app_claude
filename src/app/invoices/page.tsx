import { AppShell } from "@/components/app-shell";
import { InvoiceManager } from "./invoice-manager";

export default function Page() {
  return (
    <AppShell title="Faturat" subtitle="Ktheji punët e përfunduara në pozicione faturimi dhe finalizo faturën vetëm kur është gati.">
      <InvoiceManager />
    </AppShell>
  );
}
