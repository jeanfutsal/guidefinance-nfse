import { Header } from "@/components/ui/Header";
import { BillingAreaChart, ClientsBarChart, DistributionPieChart } from "@/components/charts/InvoiceCharts";
import { InvoiceRepositoryProvider } from "@/infra/repositories/InvoiceRepositoryProvider";
import { BarChart3, TrendingUp, Receipt, Users } from "lucide-react";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const repository = InvoiceRepositoryProvider.getServerRepository();
  let stats;
  try {
    stats = await repository.getStats();
  } catch {
    stats = { totalInvoiced: 0, totalLiquid: 0, totalTax: 0, invoiceCount: 0, averageValue: 0, topClients: [], topSuppliers: [], monthlyBilling: [] };
  }

  return (
    <div>
      <Header title="Relatórios e Análises" subtitle="Visão analítica detalhada das notas fiscais" />

      <div className="p-6 space-y-6">
        {/* Resumo geral */}
        <div className="glass-card rounded-xl p-5 border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            Resumo Financeiro Geral
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Faturamento Bruto", value: formatBRL(stats.totalInvoiced), color: "text-indigo-400" },
              { label: "Receita Líquida", value: formatBRL(stats.totalLiquid), color: "text-emerald-400" },
              { label: "Total de Impostos", value: formatBRL(stats.totalTax), color: "text-amber-400" },
              { label: "Ticket Médio", value: formatBRL(stats.averageValue), color: "text-cyan-400" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-secondary/40">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Faturamento mensal */}
        <div className="glass-card rounded-xl p-5 border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            Evolução Mensal do Faturamento
          </h2>
          <BillingAreaChart data={stats.monthlyBilling} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Maiores Clientes */}
          <div className="glass-card rounded-xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={16} className="text-cyan-400" />
              Maiores Clientes (Tomadores)
            </h2>
            <ClientsBarChart data={stats.topClients} />
            {stats.topClients.length > 0 && (
              <div className="mt-4 space-y-2">
                {stats.topClients.map((client, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="text-foreground truncate">{client.name}</span>
                    </div>
                    <div className="flex-shrink-0 text-right ml-4">
                      <span className="text-emerald-400 font-medium">{formatBRL(client.value)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({client.count} nota{client.count !== 1 ? "s" : ""})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Distribuição por cliente */}
          <div className="glass-card rounded-xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Receipt size={16} className="text-amber-400" />
              Distribuição por Cliente
            </h2>
            <DistributionPieChart data={stats.topClients.map((c) => ({ name: c.name, value: c.value }))} />
          </div>
        </div>

        {/* Maiores emitentes */}
        {stats.topSuppliers.length > 0 && (
          <div className="glass-card rounded-xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              Prestadores de Serviço (Emitentes)
            </h2>
            <div className="space-y-2">
              {stats.topSuppliers.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-indigo-500/10 text-indigo-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-foreground truncate">{s.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-indigo-400 font-medium">{formatBRL(s.value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({s.count} nota{s.count !== 1 ? "s" : ""})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
