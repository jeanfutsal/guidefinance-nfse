import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { TicketsAdmin } from "@/components/tickets/TicketsAdmin";

export const dynamic = "force-dynamic";

export default function AdminTicketsPage() {
  requireAdmin();
  return (
    <div>
      <Header
        title="Tickets"
        subtitle="Chamados dos usuários: responder, alterar status e remover"
      />
      <div className="p-6">
        <TicketsAdmin />
      </div>
    </div>
  );
}
