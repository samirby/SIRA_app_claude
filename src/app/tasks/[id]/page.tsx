import { AppShell } from "@/components/app-shell";
import { TaskDetail } from "./task-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppShell title="Detyra" subtitle="">
    <TaskDetail taskId={Number((await params).id)} />
  </AppShell>;
}
