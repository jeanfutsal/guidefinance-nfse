import { NotificationRepository, NotificationInput } from "../../repositories/NotificationRepository";
import { Notification } from "../../entities/Notification";
import { prisma } from "../db/prisma";
import type { Notification as NotificationDb } from "@prisma/client";

export class PrismaNotificationRepository implements NotificationRepository {
  async create(input: NotificationInput): Promise<Notification> {
    const result = await prisma.notification.create({
      data: {
        userId: input.userId,
        ticketId: input.ticketId ?? null,
        title: input.title,
        message: input.message ?? null,
      },
    });
    return this.mapToEntity(result);
  }

  async findManyByUser(userId: string, limit = 20): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return notifications.map(this.mapToEntity);
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.updateMany({
        where: { id, userId, read: false },
        data: { read: true },
      });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  private mapToEntity(db: NotificationDb): Notification {
    return {
      id: db.id,
      userId: db.userId,
      ticketId: db.ticketId,
      title: db.title,
      message: db.message,
      read: db.read,
      createdAt: db.createdAt.toISOString(),
    };
  }
}
