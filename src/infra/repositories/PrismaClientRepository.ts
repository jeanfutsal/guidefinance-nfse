import { ClientRepository } from "../../repositories/ClientRepository";
import { Client } from "../../entities/Client";
import { prisma } from "../db/prisma";
import { PrismaAuditLogRepository } from "./PrismaAuditLogRepository";
import type { Prisma, Client as ClientDb } from "@prisma/client";

export class PrismaClientRepository implements ClientRepository {
  private audit = new PrismaAuditLogRepository();

  async save(
    client: Omit<Client, "id"> & { id?: string },
    auditCtx?: { changedById: string; changedByName?: string }
  ): Promise<Client> {
    const data = {
      cnpj: client.cnpj,
      razaoSocial: client.razaoSocial,
      nomeFantasia: client.nomeFantasia ?? null,
      email: client.email ?? null,
      phone: client.phone ?? null,
      city: client.city ?? null,
      state: client.state ?? null,
      observacao: client.observacao ?? null,
    };

    let result;
    let action: string;
    let oldValue: string | null = null;
    let fieldName: string | undefined;

    if (client.id) {
      const existing = await prisma.client.findUnique({ where: { id: client.id } });
      oldValue = existing ? JSON.stringify(existing) : null;
      result = await prisma.client.update({ where: { id: client.id }, data });
      action = "UPDATE";
      fieldName = undefined; // múltiplos campos, registrar como update geral
    } else {
      result = await prisma.client.create({ data });
      action = "CREATE";
    }

    if (auditCtx) {
      await this.audit.create({
        entityType: "Client",
        entityId: result.id,
        action,
        fieldName,
        oldValue,
        newValue: JSON.stringify(result),
        changedById: auditCtx.changedById,
        changedByName: auditCtx.changedByName ?? null,
      });
    }
    return this.mapToEntity(result);
  }

  async findMany(filters?: { search?: string; city?: string; state?: string }): Promise<Client[]> {
    const where: Prisma.ClientWhereInput = {};
    if (filters?.search) {
      where.OR = [
        { razaoSocial: { contains: filters.search } },
        { nomeFantasia: { contains: filters.search } },
        { cnpj: { contains: filters.search } },
      ];
    }
    if (filters?.city) where.city = { contains: filters.city };
    if (filters?.state) where.state = { contains: filters.state };

    const clients = await prisma.client.findMany({ where, orderBy: { razaoSocial: "asc" } });
    return clients.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({ where: { id } });
    return client ? this.mapToEntity(client) : null;
  }

  async findByCnpj(cnpj: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({ where: { cnpj } });
    return client ? this.mapToEntity(client) : null;
  }

  /**
   * Lista clientes com a quantidade de notas fiscais do respectivo CNPJ
   * (tomador). Usado na listação administrativa.
   */
  async findManyWithInvoiceCounts(): Promise<(Client & { invoiceCount: number })[]> {
    const [clients, counts] = await Promise.all([
      prisma.client.findMany({ orderBy: { razaoSocial: "asc" } }),
      prisma.invoice.groupBy({ by: ["tomadorCnpj"], _count: { _all: true } }),
    ]);
    const byCnpj = new Map(counts.map((c) => [c.tomadorCnpj, c._count._all]));
    return clients.map((c) => ({
      ...this.mapToEntity(c),
      invoiceCount: byCnpj.get(c.cnpj) ?? 0,
    }));
  }

  /**
   * Cria clientes automaticamente para CNPJs de tomador ainda não
   * cadastrados. Retorna a quantidade de clientes criados.
   */
  async syncFromInvoices(): Promise<number> {
    const tomadores = await prisma.invoice.groupBy({
      by: ["tomadorCnpj", "tomadorName"],
    });
    let created = 0;
    for (const t of tomadores) {
      if (!t.tomadorCnpj) continue;
      const existing = await prisma.client.findUnique({ where: { cnpj: t.tomadorCnpj } });
      if (existing) continue;
      await prisma.client.create({
        data: {
          cnpj: t.tomadorCnpj,
          razaoSocial: t.tomadorName?.trim() || t.tomadorCnpj,
        },
      });
      created += 1;
    }
    return created;
  }

  async delete(
    id: string,
    auditCtx?: { changedById: string; changedByName?: string }
  ): Promise<boolean> {
    try {
      const existing = await prisma.client.findUnique({ where: { id } });
      await prisma.client.delete({ where: { id } });
      if (auditCtx && existing) {
        await this.audit.create({
          entityType: "Client",
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

  private mapToEntity(db: ClientDb): Client {
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