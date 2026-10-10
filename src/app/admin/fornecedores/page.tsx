import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { PrismaSupplierRepository } from "@/infra/repositories/PrismaSupplierRepository";
import { RowActions } from "@/components/admin/RowActions";
import Link from "next/link";
import { Plus, Search, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

const repo = new PrismaSupplierRepository();

export default async function AdminSuppliersPage() {
  await requireAdmin();

  const suppliers = await repo.findMany();

  return (
    <div>
      <Header title="Fornecedores (Emitentes)" subtitle="Cadastro e gerenciamento de prestadores de serviço" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              className="glass-input w-full pl-9 pr-4 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="/admin/fornecedores/novo"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo Fornecedor
          </Link>
        </div>

        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Razão Social</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CNPJ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                  <td className="px-4 py-3 font-medium text-foreground">{s.razaoSocial}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cnpj}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.city || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.state || "—"}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      editHref={`/admin/fornecedores/${s.id}`}
                      deleteUrl={`/api/suppliers/${s.id}`}
                      label={s.razaoSocial}
                    />
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Building2 size={28} className="mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum fornecedor cadastrado ainda.</p>
                    <Link href="/admin/fornecedores/novo" className="text-primary text-sm hover:underline mt-1 inline-block">
                      Cadastrar o primeiro fornecedor
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
