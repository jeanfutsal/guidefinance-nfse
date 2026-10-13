import { Notification } from "../entities/Notification";

export interface NotificationInput {
  userId: string;
  ticketId?: string | null;
  title: string;
  message?: string | null;
}

export interface NotificationRepository {
  create(input: NotificationInput): Promise<Notification>;
  /** Mais recentes primeiro */
  findManyByUser(userId: string, limit?: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  /** Marca como lida — retorna false se não pertencer ao usuário */
  markRead(id: string, userId: string): Promise<boolean>;
  /** Marca todas como lidas — retorna a quantidade afetada */
  markAllRead(userId: string): Promise<number>;
}
