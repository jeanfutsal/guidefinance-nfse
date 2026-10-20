import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { MetricCard } from "@/components/admin/MetricCard";
import { InvoiceRepositoryProvider } from "@/infra/repositories/InvoiceRepositoryProvider";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";
import { PrismaTicketRepository } from "@/infra/repositories/PrismaTicketRepository";
import type { DashboardStats } from "@/core/entities/Invoice";
import {
  BillingAreaChart,
  ClientsBarChart,
} from "@/components/charts/InvoiceCharts";
import {
  ShieldCheck,
  Users,
  Building2,
  FileText,
  UserCog,
  Workflow,
  LifeBuoy,
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

const EMPTY_STATS: DashboardStats = {
  totalInvoiced: 0,
  totalLiquid: 0,
  totalTax: 0,
  invoiceCount: 0,
  averageValue: 0,
  topClients: [],
  topSuppliers: [],
  monthlyBilling: [],
};

export default async function AdminPage() {
  await requireAdmin();

  // --- Indicadores reais do banco (com fallback para valores zerados) ---
  let stats: DashboardStats = EMPTY_STATS;
  let clientCount = 0;
  const processStatusCounts: Record<string, number> = {};
  let openTicketCount = 0;

  try {
    stats = await InvoiceRepositoryProvider.getServerRepository().getStats();
  } catch {
    stats = EMPTY_STATS;
  }

  try {
    const [clients, processes, tickets] = await Promise.all([
      new PrismaClientRepository().findMany(),
      new PrismaProcessRepository().findMany(),
      new PrismaTicketRepository().findMany(),
    ]);
    clientCount = clients.length;
    for (const p of processes) {
      processStatusCounts[p.status] = (processStatusCounts[p.status] ?? 0) + 1;
    }
    openTicketCount = tickets.filter(
      (t) => t.status === "aberto" || t.status === "em_andamento"
    ).length;
  } catch {
    // Dashboard continua funcionando mesmo sem dados operacionais
  }

  // Variação do faturamento: último mês vs. anterior (quando houver ambos)
  const monthly = stats.monthlyBilling;
  let billingTrend: { value: number; label: string } | undefined;
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (prev.value > 0) {
      const pct = Math.round(((last.value - prev.value) / prev.value) * 100);
      billingTrend = {
        value: pct,
        label: `Faturamento de ${last.month} vs. ${prev.month}`,
      };
    }
  }

  const cards = [
    {
      href: "/admin/usuarios",
      icon: UserCog,
      title: "Usuários",
      desc: "Contas, papéis e acessos",
      color: "text-amber-400 bg-amber-500/10",
    },

    {
      href: "/admin/fornecedores",
      icon: Building2,
      title: "Fornecedores",
      desc: "Cadastro de emitentes (prestadores)",
      color: "text-cyan-400 bg-cyan-500/10",
    },
    {
      href: "/admin/clients",
      icon: Users,
      title: "Clientes (Tomadores)",
      desc: "Cadastro de tomadores de serviço",
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      href: "/admin/processos",
      icon: Workflow,
      title: "Processos",
      desc: "Acompanhamento com timeline de etapas",
      color: "text-violet-400 bg-violet-500/10",
    },
    {
      href: "/admin/tickets",
      icon: LifeBuoy,
      title: "Tickets",
      desc: "Chamados dos usuários e respostas",
      color: "text-rose-400 bg-rose-500/10",
    },
    {
      href: "/notas",
      icon: FileText,
      title: "Notas Fiscais",
      desc: "Inclusão, edição e arquivamento",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div>
      <Header
        title="Administração"
        subtitle="Gestão de cadastros e configurações do sistema"
      />

      <div className="p-6 space-y-6">
        <div className="glass-card rounded-xl p-6 border border-primary/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Área do administrador</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Somente usuários com papel admin podem acessar esta área.
            </p>
          </div>
        </div>

        {/* Indicadores reais do banco */}
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Indicadores Gerais
            </h2>
            <p className="text-xs text-muted-foreground">
              Dados consolidados do sistema, atualizados a cada acesso
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Faturamento Líquido"
              value={formatBRL(stats.totalLiquid)}
              subtitle="Somatório das notas não arquivadas"
              icon={<DollarSign size={18} />}
              color="emerald"
              href="/relatorios"
              linkLabel="Ver relatórios"
              trend={billingTrend}
            />
            <MetricCard
              title="Notas Fiscais"
              value={stats.invoiceCount}
              subtitle={`${stats.topClients.length} clientes distintos`}
              icon={<FileText size={18} />}
              color="indigo"
              href="/notas"
              linkLabel="Ver notas"
            />
            <MetricCard
              title="Ticket Médio"
              value={formatBRL(stats.averageValue)}
              subtitle="Valor médio por nota emitida"
              icon={<Receipt size={18} />}
              color="cyan"
              href="/notas"
              linkLabel="Ver notas"
            />
            <MetricCard
              title="Clientes Cadastrados"
              value={clientCount}
              subtitle="Tomadores de serviço ativos"
              icon={<Users size={18} />}
              color="violet"
              href="/admin/clients"
              linkLabel="Ver clientes"
            />
            <MetricCard
              title="Processos em Andamento"
              value={processStatusCounts["em_andamento"] ?? 0}
              subtitle={`${processStatusCounts["concluido"] ?? 0} concluídos · ${processStatusCounts["aguardando"] ?? 0} aguardando`}
              icon={<Workflow size={18} />}
              color="amber"
              href="/admin/processos"
              linkLabel="Ver processos"
            />
            <MetricCard
              title="Tickets em Aberto"
              value={openTicketCount}
              subtitle="Abertos ou em atendimento"
              icon={<LifeBuoy size={18} />}
              color="rose"
              href="/admin/tickets"
              linkLabel="Ver tickets"
            />
          </div>
        </div>

        {/* Gráficos: faturamento mensal e top clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" />
                Evolução Mensal do Faturamento
              </h2>
              <Link
                href="/relatorios"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver relatórios <ArrowRight size={12} />
              </Link>
            </div>
            <BillingAreaChart data={stats.monthlyBilling} />
          </div>

          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                Maiores Clientes (Tomadores)
              </h2>
              <Link
                href="/admin/clients"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver clientes <ArrowRight size={12} />
              </Link>
            </div>
            <ClientsBarChart data={stats.topClients} />
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Acesso Rápido
          </h2>
          <p className="text-xs text-muted-foreground">
            Atalhos para as seções de gestão
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ href, icon: Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="glass-card rounded-xl p-5 border border-border flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
