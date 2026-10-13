import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";
import { RowActions } from "@/components/admin/RowActions";
import Link from "next/link";
import { Plus, Search, Workflow } from "lucide-react";
import { PROCESS_STATUSES, PROCESS_STATUS_LABELS } from "@/entities/Process";

export const dynamic = "force-dynamic";

const repo = new PrismaProcessRepository();

export default async function AdminProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  await requireAdmin();

  const { search, status } = await searchParams;
  const processes = await repo.findMany({
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <div>
      <Header title="Processos" subtitle="Acompanhamento com timeline de etapas" />
      <div className="p-6 space-y-6">
        <form className="flex flex-wrap items-center gap-3" action="/admin/processos" method="get">
          <div className="relative flex-1 min-w-52 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Buscar processo..."
              className="glass-input w-full pl-9 pr-4 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="glass-input rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="">Todos os status</option>
            {PROCESS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROCESS_STATUS_LABELS[s].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary transition-colors"
          >
            Filtrar
          </button>
          <Link
            href="/admin/processos/novo"
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo Processo
          </Link>
        </form>

        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Etapas</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Atualizado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const badge = PROCESS_STATUS_LABELS[p.status] ?? PROCESS_STATUS_LABELS.aberto;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/processos/${p.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.clientName || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.steps?.length ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(p.updatedAt))}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          editHref={`/admin/processos/${p.id}`}
                          deleteUrl={`/api/processes/${p.id}`}
                          label={p.title}
                        />
                      </td>
                    </tr>
                  );
                })}
                {processes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <Workflow size={28} className="mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {search || status
                          ? "Nenhum processo encontrado."
                          : "Nenhum processo cadastrado ainda."}
                      </p>
                      {!search && !status && (
                        <Link
                          href="/admin/processos/novo"
                          className="text-primary text-sm hover:underline mt-1 inline-block"
                        >
                          Criar o primeiro processo
                        </Link>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

