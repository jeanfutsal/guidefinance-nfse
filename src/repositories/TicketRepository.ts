import { Ticket } from "../entities/Ticket";

export interface TicketFilters {
  search?: string;
  status?: string;
  /** Filtra apenas tickets do usuário (para usuários comuns) */
  userId?: string;
}

export interface TicketInput {
  id?: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  userId: string;
  processId?: string | null;
  response?: string | null;
  respondedAt?: Date | null;
}

export interface TicketRepository {
  save(ticket: TicketInput): Promise<Ticket>;
  findMany(filters?: TicketFilters): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  delete(id: string): Promise<boolean>;
}
