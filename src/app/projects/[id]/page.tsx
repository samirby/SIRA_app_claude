import { AppShell } from "@/components/app-shell";
import { ProjectDetail } from "./project-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppShell title="Projekti" subtitle=""><ProjectDetail projectId={Number((await params).id)} /></AppShell>;
}
