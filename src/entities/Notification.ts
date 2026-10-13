export interface Notification {
  id: string;
  userId: string;
  ticketId?: string | null;
  title: string;
  message?: string | null;
  read: boolean;
  createdAt: string;
}
