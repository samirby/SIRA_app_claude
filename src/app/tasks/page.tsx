import { AppShell } from "@/components/app-shell";
import { TaskManager } from "./task-manager";

export default function Page() {
 return <AppShell title="Detyrat" subtitle="Planifiko punët, përcill afatet dhe dërgo detyrat e përfunduara për faturim.">
   <TaskManager />
 </AppShell>;
}
