export interface ProcessStep {
  id: string;
  processId: string;
  title: string;
  description?: string | null;
  /** Cor do bullet na timeline (hex, ex.: "#6366f1") */
  color: string;
  /** Data do evento exibida na timeline (ISO) */
  date: string;
  createdAt: string;
}

/** Cores predefinidas para os bullets da timeline */
export const STEP_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#64748b", // slate
] as const;
