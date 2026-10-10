import { ClientRepository } from "../../repositories/ClientRepository";
import { Client } from "../../entities/Client";
import { prisma } from "../db/prisma";
import type { Prisma, Client as ClientDb } from "@prisma/client";

export class PrismaClientRepository implements ClientRepository {
  async save(client: Omit<Client, "id"> & { id?: string }): Promise<Client> {
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
    if (client.id) {
      result = await prisma.client.update({ where: { id: client.id }, data });
    } else {
      result = await prisma.client.create({ data });
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

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.client.delete({ where: { id } });
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