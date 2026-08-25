import { AppShell } from "@/components/app-shell";
import { TicketManager } from "./ticket-manager";
export const dynamic="force-dynamic";
export default function Page(){return <AppShell title="Ticket System" subtitle="Menaxho kërkesat, problemet dhe mbështetjen për klientët."><TicketManager/></AppShell>}
