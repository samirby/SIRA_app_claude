import { AppShell } from "@/components/app-shell";
import { ProjectManager } from "./project-manager";

export default function Page() {
 return <AppShell title="Projektet" subtitle="Krijo projektet dhe lidhi drejtpërdrejt me detyrat aktive.">
   <ProjectManager />
 </AppShell>;
}
