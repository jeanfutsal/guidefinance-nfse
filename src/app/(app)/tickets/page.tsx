import { Header } from "@/components/ui/Header";
import { MyTickets } from "@/components/tickets/MyTickets";

export const dynamic = "force-dynamic";

export default function TicketsPage() {
  return (
    <div>
      <Header
        title="Meus Tickets"
        subtitle="Acompanhe os chamados abertos por você e as respostas da equipe"
      />
      <div className="p-6">
        <MyTickets />
      </div>
    </div>
  );
}
