"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface StatusDonutProps {
  data: { name: string; value: number }[];
  /** Formata o valor no tooltip (padrão: contagem) */
  emptyMessage?: string;
}

const STATUS_COLORS = ["#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#64748b", "#f43f5e"];

/**
 * Donut de contagens por status (processos, tickets).
 * Diferente dos gráficos financeiros, aqui os valores são quantidades.
 */
export function StatusDonutChart({ data, emptyMessage }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        {emptyMessage ?? "Sem dados para exibir."}
      </div>
    );
  }

  const visible = data.filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={visible}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {visible.map((_, i) => (
            <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          formatter={(value) => [`${Number(value)} ocorrência(s)`, "Quantidade"]}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
          formatter={(value: string) =>
            value.length > 15 ? value.substring(0, 15) + "…" : value
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
