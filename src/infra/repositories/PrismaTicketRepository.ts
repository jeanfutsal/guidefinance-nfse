import { TicketRepository, TicketFilters, TicketInput } from "../../repositories/TicketRepository";
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "../../entities/Ticket";
import { prisma } from "../db/prisma";
import type { Prisma, Ticket as TicketDb } from "@prisma/client";

export class PrismaTicketRepository implements TicketRepository {
  async save(ticket: TicketInput): Promise<Ticket> {
    const data = {
      title: ticket.title,
      description: ticket.description ?? null,
      status: ticket.status ?? "aberto",
      priority: ticket.priority ?? "media",
      userId: ticket.userId,
      processId: ticket.processId ?? null,
      response: ticket.response ?? null,
      respondedAt: ticket.respondedAt ?? null,
    };

    let result;
    if (ticket.id) {
      result = await prisma.ticket.update({ where: { id: ticket.id }, data });
    } else {
      result = await prisma.ticket.create({ data });
    }
    return this.mapToEntity(result);
  }

  async findMany(filters?: TicketFilters): Promise<Ticket[]> {
    const where: Prisma.TicketWhereInput = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        process: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return tickets.map((t) =>
      this.mapToEntity(t, {
        userName: t.user?.name,
        userEmail: t.user?.email,
        processTitle: t.process?.title,
      })
    );
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        process: { select: { title: true } },
      },
    });
    return ticket
      ? this.mapToEntity(ticket, {
          userName: ticket.user?.name,
          userEmail: ticket.user?.email,
          processTitle: ticket.process?.title,
        })
      : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.ticket.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // ---- Helpers ----

  private normalizeStatus(status: string): TicketStatus {
    return (TICKET_STATUSES as readonly string[]).includes(status)
      ? (status as TicketStatus)
      : "aberto";
  }

  private normalizePriority(priority: string): TicketPriority {
    return (TICKET_PRIORITIES as readonly string[]).includes(priority)
      ? (priority as TicketPriority)
      : "media";
  }

  private mapToEntity(
    db: TicketDb & {
      user?: { name: string | null; email: string | null } | null;
      process?: { title: string } | null;
    },
    extra?: { userName?: string | null; userEmail?: string | null; processTitle?: string | null }
  ): Ticket {
    return {
      id: db.id,
      title: db.title,
      description: db.description,
      status: this.normalizeStatus(db.status),
      priority: this.normalizePriority(db.priority),
      userId: db.userId,
      userName: extra?.userName ?? db.user?.name ?? null,
      userEmail: extra?.userEmail ?? db.user?.email ?? null,
      processId: db.processId,
      processTitle: extra?.processTitle ?? db.process?.title ?? null,
      response: db.response,
      respondedAt: db.respondedAt ? db.respondedAt.toISOString() : null,
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString(),
    };
  }
}
