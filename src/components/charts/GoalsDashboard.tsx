"use client";

import { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Target, Sliders, Sparkles, Pencil } from "lucide-react";

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
  // Define active data: database stats if available, otherwise mock data for presentation
  const isMock = !monthlyBilling || monthlyBilling.length === 0;
  const billingData = useMemo(() => {
    if (isMock) return mockMonths;
    // Map existing database data to ensure we calculate net value
    return monthlyBilling.map((item) => ({
      month: item.month,
      value: item.value,
      tax: item.tax,
    }));
  }, [monthlyBilling, isMock]);

  // Total available months
  const totalMonths = billingData.length;

  // Selected month index for the slider (starts at the last month by default)
  const [selectedIndex, setSelectedIndex] = useState(totalMonths - 1);

  // Editable goal state - user types the value manually
  const [goalInput, setGoalInput] = useState("100000");
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Parse goalInput to a numeric value, fallback to 1 to avoid division by zero
  const OVERALL_GOAL = useMemo(() => {
    const parsed = parseFloat(goalInput.replace(/\./g, "").replace(",", "."));
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [goalInput]);

  // Compute overall totals for the left gauge (Net Revenue)
  const finalTotalLiquid = useMemo(() => {
    if (isMock) {
      return billingData.reduce((acc, curr) => acc + (curr.value - curr.tax), 0);
    }
    return totalLiquid;
  }, [totalLiquid, billingData, isMock]);

  // Calculate proportional target up to selected index for the right gauge
  const selectedTarget = useMemo(() => {
    const proportion = (selectedIndex + 1) / totalMonths;
    return OVERALL_GOAL * proportion;
  }, [selectedIndex, totalMonths, OVERALL_GOAL]);

  // Cumulative values up to the selected month index
  const cumulativeNet = useMemo(() => {
    let sum = 0;
    for (let i = 0; i <= selectedIndex; i++) {
      const item = billingData[i];
      sum += (item.value - item.tax);
    }
    return sum;
  }, [selectedIndex, billingData]);

  // Helper format currency BRL
  const formatBRL = (v: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  };

  // Helper to render Recharts gauge
  const renderGauge = (current: number, target: number, fillColors: string[], glowColor: string) => {
    const percent = Math.min(100, (current / target) * 100);
    const gaugeData = [
      { name: "progress", value: percent },
      { name: "remaining", value: Math.max(0, 100 - percent) },
    ];

    return (
      <div className="relative w-full h-[140px] flex items-center justify-center">
        {/* Glow behind the gauge */}
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
              {/* Progress part: color gradient */}
              <Cell fill={fillColors[0]} />
              {/* Remaining part: dark space slot background */}
              <Cell fill="#161e31" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Central Text Label */}
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
      {/* Header section */}
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

      {/* Main Grid Layout: Left Gauge, Center Controls, Right Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* LEFT CARD: Net Revenue Gauge */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/40 h-full">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Faturamento Líquido</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5">Realizado Total vs Meta</h3>
          </div>
          
          {renderGauge(finalTotalLiquid, OVERALL_GOAL, ["#eab308", "#161e31"], "#eab308")}
          
          <div className="flex justify-between w-full px-8 text-[10px] font-semibold text-muted-foreground mt-2">
            <span>0%</span>
            <span>Meta: {formatBRL(OVERALL_GOAL)}</span>
            <span>100%</span>
          </div>
        </div>

        {/* CENTER CARD: Interactive Neon Slider */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/35 border border-border/60 h-full space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400">
              <Sliders size={12} />
              Simulação Mensal
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-4">
              Deslize o controle abaixo para selecionar o período de faturamento acumulado.
            </p>
          </div>

          {/* Editable Goal Input */}
          <div className="w-full px-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Meta Anual
              </span>
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
                    <Pencil
                      size={12}
                      className="text-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    />
                  </div>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                {isEditingGoal ? "Pressione Enter ou clique fora para confirmar" : "Clique para editar a meta"}
              </p>
            </div>
          </div>

          {/* Selected period details */}
          <div className="text-center p-2 rounded-lg bg-card/40 border border-border/50 min-w-[200px]">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Período Selecionado</span>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {billingData[0].month} a {billingData[selectedIndex].month}
            </div>
            <div className="text-xs text-cyan-400 font-medium mt-1">
              {selectedIndex + 1} {selectedIndex === 0 ? "mês selecionado" : "meses selecionados"}
            </div>
          </div>

          {/* Neon Range Slider Container */}
          <div className="w-full px-4 py-2">
            <input
              type="range"
              min="0"
              max={totalMonths - 1}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
              className="neon-slider"
            />
            
            {/* Months Indicators */}
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-3 px-1">
              {billingData.map((d, index) => {
                const isActive = index === selectedIndex;
                const isPast = index <= selectedIndex;
                return (
                  <span
                    key={index}
                    className={`cursor-pointer transition-all duration-200 select-none ${
                      isActive 
                        ? "text-cyan-400 scale-125 font-extrabold drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" 
                        : isPast 
                          ? "text-muted-foreground" 
                          : "text-muted-foreground/40"
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {d.month.split("/")[0].split(" ")[0]}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Cumulative Value Gauge */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/40 h-full">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Faturamento Acumulado</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5">Cenário Período vs Meta</h3>
          </div>

          {renderGauge(cumulativeNet, selectedTarget, ["#10b981", "#161e31"], "#10b981")}

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
