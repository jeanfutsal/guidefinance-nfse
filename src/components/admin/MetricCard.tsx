import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MetricCardProps {
  /** Rótulo do indicador (ex: "Faturamento Líquido") */
  title: string;
  /** Valor exibido — números são formatados no padrão pt-BR */
  value: string | number;
  /** Texto auxiliar opcional abaixo do valor */
  subtitle?: string;
  icon: React.ReactNode;
  color?: "indigo" | "cyan" | "emerald" | "amber" | "rose" | "violet";
  /** Quando presente, o card inteiro vira um link de navegação */
  href?: string;
  /** Texto do link (padrão: "Ver detalhes") */
  linkLabel?: string;
  /** Variação percentual opcional (ex: evolução mensal) */
  trend?: { value: number; label: string };
  /** Quando true, exibe skeleton de carregamento em vez do conteúdo real */
  loading?: boolean;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    border: "border-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    icon: "text-rose-400",
    border: "border-rose-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
    border: "border-violet-500/20",
  },
};

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR").format(value);
  }
  return value;
}

/**
 * Card de indicador (KPI) para dashboards admin.
 * Segue a mesma linguagem visual do StatCard, mas com suporte a
 * navegação (href) — o card inteiro vira um <Link> do Next.js.
 * Componente server-side: sem "use client", sem hooks.
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = "indigo",
  href,
  linkLabel = "Ver detalhes",
  trend,
  loading = false,
}: MetricCardProps) {
  const colors = colorMap[color];
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  if (loading) {
    const className = `glass-card rounded-xl p-5 border ${colors.border} flex flex-col gap-3 animate-pulse`;
    const skeleton = (h: string, w: string) => (
      <div className="bg-muted rounded animate-pulse" style={{ height: h, width: w }} />
    );

    if (href) {
      return (
        <Link href={href} className={className}>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-muted">{skeleton("100%", "100%")}</div>
            <div className="w-20">{skeleton("10px", "100%")}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-4 w-2/3 mb-1">{skeleton("100%", "100%")}</div>
            <div className="h-8 w-1/2">{skeleton("100%", "100%")}</div>
            <div className="h-4 w-1/3 mt-1">{skeleton("100%", "100%")}</div>
          </div>
          <div className="h-4 w-1/4">{skeleton("100%", "100%")}</div>
        </Link>
      );
    }

    return (
      <div className={className}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-muted">{skeleton("100%", "100%")}</div>
          <div className="w-20">{skeleton("10px", "100%")}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-2/3 mb-1">{skeleton("100%", "100%")}</div>
          <div className="h-8 w-1/2">{skeleton("100%", "100%")}</div>
          <div className="h-4 w-1/3 mt-1">{skeleton("100%", "100%")}</div>
        </div>
        <div className="h-4 w-1/4">{skeleton("100%", "100%")}</div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${trendPositive ? "bg-emerald-500/10 text-emerald-400" : ""}
              ${trendNegative ? "bg-rose-500/10 text-rose-400" : ""}
              ${
                !trendPositive && !trendNegative
                  ? "bg-muted text-muted-foreground"
                  : ""
              }`}
          >
            {trendPositive ? "▲" : trendNegative ? "▼" : "—"}{" "}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {trend && (
        <p
          className={`text-xs ${
            trendPositive
              ? "text-emerald-400"
              : trendNegative
                ? "text-rose-400"
                : "text-muted-foreground"
          }`}
        >
          {trend.label}
        </p>
      )}

      {href && (
        <p className="text-xs text-primary hover:underline mt-auto flex items-center gap-1 font-medium">
          {linkLabel} <ArrowRight size={12} />
        </p>
      )}
    </>
  );

  const className = `glass-card rounded-xl p-5 border ${colors.border} flex flex-col gap-3 transition-opacity${
    href ? " hover:opacity-80 cursor-pointer" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
