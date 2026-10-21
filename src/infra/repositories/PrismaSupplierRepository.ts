import { SupplierRepository } from "../../repositories/SupplierRepository";
import { Supplier } from "../../entities/Supplier";
import { prisma } from "../db/prisma";
import { PrismaAuditLogRepository } from "./PrismaAuditLogRepository";
import type { Prisma, Supplier as SupplierDb } from "@prisma/client";

export class PrismaSupplierRepository implements SupplierRepository {
  private audit = new PrismaAuditLogRepository();

  async save(
    supplier: Omit<Supplier, "id"> & { id?: string },
    auditCtx?: { changedById: string; changedByName?: string }
  ): Promise<Supplier> {
    const data = {
      cnpj: supplier.cnpj,
      razaoSocial: supplier.razaoSocial,
      nomeFantasia: supplier.nomeFantasia ?? null,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      city: supplier.city ?? null,
      state: supplier.state ?? null,
      observacao: supplier.observacao ?? null,
    };

    let result;
    let action: string;
    let oldValue: string | null = null;

    if (supplier.id) {
      const existing = await prisma.supplier.findUnique({ where: { id: supplier.id } });
      oldValue = existing ? JSON.stringify(existing) : null;
      result = await prisma.supplier.update({ where: { id: supplier.id }, data });
      action = "UPDATE";
    } else {
      result = await prisma.supplier.create({ data });
      action = "CREATE";
    }

    if (auditCtx) {
      await this.audit.create({
        entityType: "Supplier",
        entityId: result.id,
        action,
        fieldName: undefined,
        oldValue,
        newValue: JSON.stringify(result),
        changedById: auditCtx.changedById,
        changedByName: auditCtx.changedByName ?? null,
      });
    }
    return this.mapToEntity(result);
  }

  async findMany(filters?: { search?: string; city?: string; state?: string }): Promise<Supplier[]> {
    const where: Prisma.SupplierWhereInput = {};
    if (filters?.search) {
      where.OR = [
        { razaoSocial: { contains: filters.search } },
        { nomeFantasia: { contains: filters.search } },
        { cnpj: { contains: filters.search } },
      ];
    }
    if (filters?.city) where.city = { contains: filters.city };
    if (filters?.state) where.state = { contains: filters.state };

    const suppliers = await prisma.supplier.findMany({ where, orderBy: { razaoSocial: "asc" } });
    return suppliers.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    return supplier ? this.mapToEntity(supplier) : null;
  }

  async findByCnpj(cnpj: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({ where: { cnpj } });
    return supplier ? this.mapToEntity(supplier) : null;
  }

  async delete(
    id: string,
    auditCtx?: { changedById: string; changedByName?: string }
  ): Promise<boolean> {
    try {
      const existing = await prisma.supplier.findUnique({ where: { id } });
      await prisma.supplier.delete({ where: { id } });
      if (auditCtx && existing) {
        await this.audit.create({
          entityType: "Supplier",
          entityId: id,
          action: "DELETE",
          fieldName: undefined,
          oldValue: JSON.stringify(existing),
          newValue: null,
          changedById: auditCtx.changedById,
          changedByName: auditCtx.changedByName ?? null,
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(db: SupplierDb): Supplier {
    return {
      id: db.id,
      cnpj: db.cnpj,
      razaoSocial: db.razaoSocial,
      nomeFantasia: db.nomeFantasia ?? undefined,
      email: db.email ?? undefined,
      phone: db.phone ?? undefined,
      city: db.city ?? undefined,
      state: db.state ?? undefined,
      observacao: db.observacao ?? undefined,
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString(),
    };
  }
}