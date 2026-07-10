"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface BillingChartProps {
  data: { month: string; value: number; tax: number }[];
}

const COLORS_PIE = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

export function BillingAreaChart({ data }: BillingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        Sem dados para exibir. Faça upload de NFS-e's para ver o gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradTax" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatBRL(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
        <Tooltip
          contentStyle={{ background: "#131b2e", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
          //formatter={(v: number, name: string) => [
          //  formatBRL(v),
          //  name === "value" ? "Faturamento" : "Impostos",
          //]}
          formatter={(value, name) => [
            formatBRL(Number(value ?? 0)),
            name === "value" ? "Faturamento" : "Impostos",
          ]}
        />
        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#gradValue)" name="value" dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
        <Area type="monotone" dataKey="tax" stroke="#06b6d4" strokeWidth={2} fill="url(#gradTax)" name="tax" dot={false} activeDot={{ r: 4, fill: "#06b6d4" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface ClientsBarChartProps {
  data: { name: string; value: number; count: number }[];
}

export function ClientsBarChart({ data }: ClientsBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        Nenhum cliente encontrado ainda.
      </div>
    );
  }

  const displayData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 18 ? d.name.substring(0, 18) + "…" : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={displayData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatBRL(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={110} />
        <Tooltip
          contentStyle={{ background: "#131b2e", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
          formatter={(value) => [formatBRL(Number(value ?? 0)), "Faturamento"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {displayData.map((_, i) => (
            <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DistributionPieProps {
  data: { name: string; value: number }[];
}

export function DistributionPieChart({ data }: DistributionPieProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        Sem dados para distribuição.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#131b2e", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [formatBRL(Number(value ?? 0)), String(name)]}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          formatter={(value: string) =>
            value.length > 15 ? value.substring(0, 15) + "…" : value
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
