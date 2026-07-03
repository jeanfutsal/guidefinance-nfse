import { Header } from "@/components/ui/Header";
import { StatCard } from "@/components/ui/StatCard";
import { BillingAreaChart, ClientsBarChart, DistributionPieChart } from "@/components/charts/InvoiceCharts";
import { InvoiceRepositoryProvider } from "@/infra/repositories/InvoiceRepositoryProvider";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Receipt,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const repository = InvoiceRepositoryProvider.getServerRepository();
  
  let stats;
  try {
    stats = await repository.getStats();
  } catch {
    stats = {
      totalInvoiced: 0,
      totalLiquid: 0,
      totalTax: 0,
      invoiceCount: 0,
      averageValue: 0,
      topClients: [],
      topSuppliers: [],
      monthlyBilling: [],
    };
  }

  const pieData = stats.topClients.map((c) => ({ name: c.name, value: c.value }));

  return (
    <div>
      <Header
        title="Dashboard Financeiro"
        subtitle="Visão consolidada das Notas Fiscais de Serviço"
      />

      <div className="p-6 space-y-6">
        {/* Empty state banner */}
        {stats.invoiceCount === 0 && (
          <div className="glass-card rounded-xl p-6 border border-primary/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Nenhuma NFS-e cadastrada ainda</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Faça upload de PDFs de Notas Fiscais de Serviço para começar a visualizar os dados.
              </p>
            </div>
            <Link
              href="/upload"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Fazer Upload
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Faturamento Total"
            value={formatBRL(stats.totalInvoiced)}
            subtitle={`${stats.invoiceCount} notas fiscais`}
            icon={<TrendingUp size={18} />}
            color="indigo"
          />
          <StatCard
            title="Valor Líquido"
            value={formatBRL(stats.totalLiquid)}
            subtitle="Após deduções e retenções"
            icon={<DollarSign size={18} />}
            color="emerald"
          />
          <StatCard
            title="Impostos Totais"
            value={formatBRL(stats.totalTax)}
            subtitle="ISSQN + Retenções Federais"
            icon={<Receipt size={18} />}
            color="amber"
          />
          <StatCard
            title="Ticket Médio"
            value={formatBRL(stats.averageValue)}
            subtitle="Por nota fiscal emitida"
            icon={<FileText size={18} />}
            color="cyan"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Billing area chart — 2/3 */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Faturamento Mensal</h2>
                <p className="text-xs text-muted-foreground">Receita bruta vs. impostos nos últimos 12 meses</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Faturamento</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Impostos</span>
              </div>
            </div>
            <BillingAreaChart data={stats.monthlyBilling} />
          </div>

          {/* Distribution pie — 1/3 */}
          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Distribuição por Cliente</h2>
              <p className="text-xs text-muted-foreground">Top 5 tomadores por faturamento</p>
            </div>
            <DistributionPieChart data={pieData} />
          </div>
        </div>

        {/* Top clients bar chart */}
        {stats.topClients.length > 0 && (
          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Maiores Clientes (Tomadores)</h2>
                <p className="text-xs text-muted-foreground">Ranking por volume de faturamento</p>
              </div>
              <Link href="/notas" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            <ClientsBarChart data={stats.topClients} />
          </div>
        )}

        {/* Recent invoices */}
        {stats.invoiceCount > 0 && (
          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Acesso Rápido</h2>
              <Link href="/notas" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas as notas <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-indigo-400">{stats.invoiceCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Notas Cadastradas</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-cyan-400">{stats.topClients.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Clientes Distintos</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-emerald-400">{stats.topSuppliers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Emitentes Distintos</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-amber-400">{stats.monthlyBilling.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Meses com Notas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
