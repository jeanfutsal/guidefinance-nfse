import { AuditLogRepository } from "../../repositories/AuditLogRepository";
import { AuditLog, AuditLogFilters, AuditLogPage } from "../../entities/AuditLog";
import { prisma } from "../db/prisma";
import type { Prisma, AuditLog as AuditLogDb } from "@prisma/client";

export class PrismaAuditLogRepository implements AuditLogRepository {
  async create(data: {
    entityType: string;
    entityId: string;
    action: string;
    fieldName?: string;
    oldValue?: string | null;
    newValue?: string | null;
    changedById: string;
    changedByName?: string | null;
  }): Promise<AuditLog> {
    const result = await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        fieldName: data.fieldName ?? null,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
        changedById: data.changedById,
        changedByName: data.changedByName ?? null,
      },
    });
    return this.mapToEntity(result);
  }

  async findMany(filters: AuditLogFilters): Promise<AuditLogPage> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.changedById) where.changedById = filters.changedById;

    const andConditions: Prisma.AuditLogWhereInput[] = [];

    if (filters.startDate) {
      andConditions.push({ changedAt: { gte: new Date(filters.startDate) } });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      andConditions.push({ changedAt: { lte: end } });
    }

    if (filters.search && filters.search.trim() !== "") {
      const search = filters.search.trim();
      andConditions.push({
        OR: [
          { entityId: { contains: search } },
          { changedByName: { contains: search } },
          { oldValue: { contains: search } },
          { newValue: { contains: search } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { changedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map(this.mapToEntity),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private mapToEntity(db: AuditLogDb): AuditLog {
    return {
      id: db.id,
      entityType: db.entityType,
      entityId: db.entityId,
      action: db.action,
      fieldName: db.fieldName ?? undefined,
      oldValue: db.oldValue ?? undefined,
      newValue: db.newValue ?? undefined,
      changedById: db.changedById,
      changedByName: db.changedByName ?? undefined,
      changedAt: db.changedAt.toISOString(),
    };
  }
}