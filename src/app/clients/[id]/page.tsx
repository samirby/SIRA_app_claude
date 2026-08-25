import { AppShell } from "@/components/app-shell";
import { ClientProfile } from "./client-profile";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);

  return (
    <AppShell
      title="Profili i klientit"
      subtitle="Shiko dhe përditëso të gjitha informacionet e klientit."
    >
      <ClientProfile clientId={clientId} />
    </AppShell>
  );
}
