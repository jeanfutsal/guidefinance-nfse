"use client";

import { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Target, Sliders, Sparkles, Pencil, ArrowRight } from "lucide-react";

interface GoalsDashboardProps {
  totalLiquid: number;
  totalInvoiced: number;
  monthlyBilling: { month: string; value: number; tax: number }[];
}

const mockMonths = [
  { month: "Jan/26", value: 8500, tax: 850 },
  { month: "Fev/26", value: 9200, tax: 920 },
  { month: "Mar/26", value: 11500, tax: 1150 },
  { month: "Abr/26", value: 7800, tax: 780 },
  { month: "Mai/26", value: 12500, tax: 1250 },
  { month: "Jun/26", value: 14000, tax: 1400 },
  { month: "Jul/26", value: 9500, tax: 950 },
  { month: "Ago/26", value: 11000, tax: 1100 },
  { month: "Set/26", value: 11800, tax: 1180 },
  { month: "Out/26", value: 14500, tax: 1450 },
  { month: "Nov/26", value: 13000, tax: 1300 },
  { month: "Dez/26", value: 16500, tax: 1650 },
];

export function GoalsDashboard({
  totalLiquid,
  totalInvoiced,
  monthlyBilling,
}: GoalsDashboardProps) {
  // Define active data
  const isMock = !monthlyBilling || monthlyBilling.length === 0;
  const billingData = useMemo(() => {
    if (isMock) return mockMonths;
    return monthlyBilling.map((item) => ({
      month: item.month,
      value: item.value,
      tax: item.tax,
    }));
  }, [monthlyBilling, isMock]);

  const totalMonths = billingData.length;

  // ── Range selection: startIndex + endIndex ──────────────────────────────
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(totalMonths - 1);
  // Track which handle is being set next: "start" or "end"
  const [selecting, setSelecting] = useState<"start" | "end">("start");

  const handleMonthClick = (index: number) => {
    if (selecting === "start") {
      // Starting a new range selection
      setStartIndex(index);
      setEndIndex(index);
      setSelecting("end");
    } else {
      // Setting the end of the range
      if (index < startIndex) {
        // Clicked before current start: swap
        setEndIndex(startIndex);
        setStartIndex(index);
      } else {
        setEndIndex(index);
      }
      setSelecting("start"); // Ready for next selection
    }
  };

  // ── Editable goal ───────────────────────────────────────────────────────
  const [goalInput, setGoalInput] = useState("100000");
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const OVERALL_GOAL = useMemo(() => {
    const parsed = parseFloat(goalInput.replace(/\./g, "").replace(",", "."));
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [goalInput]);

  // ── Left gauge: all-time net liquid ────────────────────────────────────
  const finalTotalLiquid = useMemo(() => {
    if (isMock) {
      return billingData.reduce((acc, curr) => acc + (curr.value - curr.tax), 0);
    }
    return totalLiquid;
  }, [totalLiquid, billingData, isMock]);

  // ── Right gauge: net for selected range ────────────────────────────────
  const rangeMonthCount = endIndex - startIndex + 1;

  const selectedTarget = useMemo(() => {
    const proportion = rangeMonthCount / totalMonths;
    return OVERALL_GOAL * proportion;
  }, [rangeMonthCount, totalMonths, OVERALL_GOAL]);

  const cumulativeNet = useMemo(() => {
    let sum = 0;
    for (let i = startIndex; i <= endIndex; i++) {
      sum += billingData[i].value - billingData[i].tax;
    }
    return sum;
  }, [startIndex, endIndex, billingData]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const shortLabel = (month: string) => month.split("/")[0].split(" ")[0];

  // ── Gauge renderer ──────────────────────────────────────────────────────
  const renderGauge = (
    current: number,
    target: number,
    fillColor: string,
    glowColor: string
  ) => {
    const percent = Math.min(100, (current / target) * 100);
    const gaugeData = [
      { name: "progress", value: percent },
      { name: "remaining", value: Math.max(0, 100 - percent) },
    ];
    return (
      <div className="relative w-full h-[140px] flex items-center justify-center">
        <div
          className="absolute bottom-0 w-[180px] h-[90px] rounded-t-full opacity-10 blur-xl pointer-events-none transition-all duration-300"
          style={{ backgroundColor: glowColor }}
        />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={72}
              outerRadius={92}
              dataKey="value"
              stroke="none"
              paddingAngle={0}
            >
              <Cell fill={fillColor} />
              <Cell fill="#161e31" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 text-center flex flex-col items-center select-none">
          <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
            {((current / target) * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-muted-foreground font-semibold mt-2 tracking-wide">
            {formatBRL(current)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-border mt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Target className="text-cyan-400 animate-pulse" size={18} />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Análise de Metas de Faturamento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Acompanhamento e evolução por período</p>
          </div>
        </div>
        {isMock && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
            <Sparkles size={10} />
            Dados Demonstrativos
          </div>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

        {/* ── LEFT: Total Net Revenue Gauge ── */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/40 h-full">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Faturamento Líquido</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5">Realizado Total vs Meta</h3>
          </div>
          {renderGauge(finalTotalLiquid, OVERALL_GOAL, "#eab308", "#eab308")}
          <div className="flex justify-between w-full px-8 text-[10px] font-semibold text-muted-foreground mt-2">
            <span>0%</span>
            <span>Meta: {formatBRL(OVERALL_GOAL)}</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── CENTER: Editable Goal + Month Range Picker ── */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-secondary/35 border border-border/60 h-full gap-4">

          {/* Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400">
              <Sliders size={12} />
              Simulação de Período
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 px-2">
              Clique no <strong className="text-cyan-400">mês de início</strong> e depois no <strong className="text-cyan-400">mês de fim</strong> para definir o intervalo.
            </p>
          </div>

          {/* Editable Goal */}
          <div className="flex flex-col items-center gap-1 w-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meta do Período</span>
            <div className="relative flex items-center gap-2 w-full max-w-[220px]">
              {isEditingGoal ? (
                <input
                  autoFocus
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value.replace(/[^0-9.,]/g, ""))}
                  onBlur={() => setIsEditingGoal(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") setIsEditingGoal(false); }}
                  className="w-full text-center text-sm font-extrabold bg-transparent border-b-2 border-cyan-400 text-cyan-300 outline-none pb-0.5 tracking-wider"
                  style={{ boxShadow: "0 2px 10px rgba(6, 182, 212, 0.5)" }}
                  placeholder="Ex: 100000"
                />
              ) : (
                <div
                  className="flex items-center justify-center gap-2 w-full cursor-pointer group"
                  onClick={() => setIsEditingGoal(true)}
                >
                  <span
                    className="text-base font-extrabold text-cyan-300 tracking-wider transition-all group-hover:text-cyan-200"
                    style={{ textShadow: "0 0 10px rgba(6, 182, 212, 0.7)" }}
                  >
                    {formatBRL(OVERALL_GOAL)}
                  </span>
                  <Pencil size={12} className="text-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground/60">
              {isEditingGoal ? "Pressione Enter ou clique fora para confirmar" : "Clique para editar a meta"}
            </p>
          </div>

          {/* Selected period summary */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 border border-border/50 w-full justify-center">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Início</p>
              <p
                className="text-sm font-extrabold mt-0.5"
                style={{
                  color: selecting === "end" ? "#06b6d4" : "#94a3b8",
                  textShadow: selecting === "end" ? "0 0 8px rgba(6,182,212,0.7)" : "none",
                }}
              >
                {billingData[startIndex].month}
              </p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground/50 flex-shrink-0" />
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Fim</p>
              <p
                className="text-sm font-extrabold mt-0.5"
                style={{
                  color: selecting === "start" && startIndex !== endIndex ? "#06b6d4" : "#94a3b8",
                  textShadow: selecting === "start" && startIndex !== endIndex ? "0 0 8px rgba(6,182,212,0.7)" : "none",
                }}
              >
                {billingData[endIndex].month}
              </p>
            </div>
            <div className="ml-2 pl-2 border-l border-border/40 text-center">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Meses</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">{rangeMonthCount}</p>
            </div>
          </div>

          {/* Instruction hint */}
          <p className="text-[10px] font-semibold tracking-wide px-1" style={{
            color: selecting === "start" ? "#94a3b8" : "#06b6d4",
            textShadow: selecting === "end" ? "0 0 6px rgba(6,182,212,0.5)" : "none",
          }}>
            {selecting === "start" ? "↓ Selecione o mês de início ↓" : "↓ Agora selecione o mês de fim ↓"}
          </p>

          {/* Month Picker Grid */}
          <div className="w-full grid grid-cols-6 gap-1.5 px-1">
            {billingData.map((d, index) => {
              const isStart = index === startIndex;
              const isEnd = index === endIndex;
              const isInRange = index > startIndex && index < endIndex;
              const isEdge = isStart || isEnd;

              return (
                <button
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  className={`
                    relative py-1.5 rounded-md text-[10px] font-bold transition-all duration-150 select-none
                    ${isEdge
                      ? "text-slate-900 font-extrabold scale-105"
                      : isInRange
                        ? "text-cyan-300"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }
                  `}
                  style={
                    isEdge
                      ? {
                          background: "linear-gradient(135deg, #06b6d4, #0e7490)",
                          boxShadow: "0 0 10px rgba(6,182,212,0.7), 0 0 20px rgba(6,182,212,0.3)",
                        }
                      : isInRange
                        ? {
                            background: "rgba(6, 182, 212, 0.12)",
                            border: "1px solid rgba(6, 182, 212, 0.25)",
                          }
                        : {
                            background: "rgba(30, 41, 59, 0.5)",
                            border: "1px solid rgba(51, 65, 85, 0.4)",
                          }
                  }
                >
                  {shortLabel(d.month)}
                  {isStart && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-extrabold text-cyan-200 leading-none">
                      INI
                    </span>
                  )}
                  {isEnd && startIndex !== endIndex && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-extrabold text-cyan-200 leading-none">
                      FIM
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reset link */}
          <button
            onClick={() => { setStartIndex(0); setEndIndex(totalMonths - 1); setSelecting("start"); }}
            className="text-[10px] text-muted-foreground/50 hover:text-cyan-400 transition-colors underline underline-offset-2"
          >
            Selecionar período completo
          </button>
        </div>

        {/* ── RIGHT: Range Cumulative Gauge ── */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/40 h-full">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Faturamento Acumulado</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5">
              {billingData[startIndex].month}
              {startIndex !== endIndex && ` → ${billingData[endIndex].month}`}
            </h3>
          </div>
          {renderGauge(cumulativeNet, selectedTarget, "#10b981", "#10b981")}
          <div className="flex justify-between w-full px-8 text-[10px] font-semibold text-muted-foreground mt-2">
            <span>0%</span>
            <span>Meta: {formatBRL(selectedTarget)}</span>
            <span>100%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
