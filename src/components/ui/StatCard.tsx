import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "indigo" | "cyan" | "emerald" | "amber" | "rose";
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-400",
    border: "border-indigo-500/20",
    trend: "text-indigo-400",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    border: "border-cyan-500/20",
    trend: "text-cyan-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    trend: "text-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    trend: "text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    icon: "text-rose-400",
    border: "border-rose-500/20",
    trend: "text-rose-400",
  },
};

export function StatCard({ title, value, subtitle, icon, trend, color = "indigo" }: StatCardProps) {
  const colors = colorMap[color];
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div className={`glass-card rounded-xl p-5 border ${colors.border} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${trendPositive ? "bg-emerald-500/10 text-emerald-400" : ""}
              ${trendNegative ? "bg-rose-500/10 text-rose-400" : ""}
              ${!trendPositive && !trendNegative ? "bg-muted text-muted-foreground" : ""}`}
          >
            {trendPositive ? "▲" : trendNegative ? "▼" : "—"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <p className={`text-xs ${trendPositive ? "text-emerald-400" : trendNegative ? "text-rose-400" : "text-muted-foreground"}`}>
          {trend.label}
        </p>
      )}
    </div>
  );
}
