import { ProcessStep } from "./ProcessStep";

export const PROCESS_STATUSES = [
  "aberto",
  "em_andamento",
  "aguardando",
  "concluido",
  "cancelado",
] as const;

export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

/** Rótulos e cores exibidos na UI (badges/bullets) */
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "text-cyan-400 bg-cyan-500/15" },
  em_andamento: { label: "Em andamento", color: "text-amber-400 bg-amber-500/15" },
  aguardando: { label: "Aguardando", color: "text-violet-400 bg-violet-500/15" },
  concluido: { label: "Concluído", color: "text-emerald-400 bg-emerald-500/15" },
  cancelado: { label: "Cancelado", color: "text-rose-400 bg-rose-500/15" },
};

export interface Process {
  id: string;
  title: string;
  description?: string | null;
  status: ProcessStatus;
  clientId?: string | null;
  clientName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  steps?: ProcessStep[];
  createdAt: string;
  updatedAt: string;
}
