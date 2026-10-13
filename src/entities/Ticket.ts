export const TICKET_STATUSES = ["aberto", "em_andamento", "respondido", "fechado"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["baixa", "media", "alta"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "text-rose-400 bg-rose-500/15" },
  em_andamento: { label: "Em andamento", color: "text-amber-400 bg-amber-500/15" },
  respondido: { label: "Respondido", color: "text-cyan-400 bg-cyan-500/15" },
  fechado: { label: "Fechado", color: "text-emerald-400 bg-emerald-500/15" },
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-muted-foreground bg-secondary" },
  media: { label: "Média", color: "text-cyan-400 bg-cyan-500/15" },
  alta: { label: "Alta", color: "text-rose-400 bg-rose-500/15" },
};

export interface Ticket {
  id: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  processId?: string | null;
  processTitle?: string | null;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
