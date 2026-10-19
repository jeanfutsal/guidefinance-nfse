import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";
import { ClientsExplorer } from "@/components/admin/ClientsExplorer";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const repo = new PrismaClientRepository();

export default async function AdminClientsPage() {
  await requireAdmin();

  // Auto-popula clientes a partir dos CNPJs de tomador encontrados nas notas
  try {
    await repo.syncFromInvoices();
  } catch (error) {
    console.error("Falha ao sincronizar clientes a partir das notas:", error);
  }

  const clients = await repo.findManyWithInvoiceCounts();

  return (
    <div>
      <Header title="Clientes (Tomadores)" subtitle="Cadastro e gerenciamento de tomadores de serviço" />
      <div className="p-6 space-y-4">
        <ClientsExplorer
          clients={clients}
          actions={
            <Link
              href="/admin/clients/novo"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Plus size={16} />
              Novo Cliente
            </Link>
          }
        />
      </div>
    </div>
  );
}