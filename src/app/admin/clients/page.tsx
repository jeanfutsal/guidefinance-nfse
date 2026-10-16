import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";
import { RowActions } from "@/components/admin/RowActions";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";

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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="glass-input w-full pl-9 pr-4 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="/admin/clients/novo"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo Cliente
          </Link>
        </div>

        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Razão Social</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CNPJ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Notas</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                  <td className="px-4 py-3 font-medium text-foreground">{c.razaoSocial}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.cnpj}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.invoiceCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.state || "—"}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      editHref={`/admin/clients/${c.id}`}
                      deleteUrl={`/api/clients/${c.id}`}
                      label={c.razaoSocial}
                    />
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Users size={28} className="mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado ainda.</p>
                    <Link href="/admin/clients/novo" className="text-primary text-sm hover:underline mt-1 inline-block">
                      Cadastrar o primeiro cliente
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
