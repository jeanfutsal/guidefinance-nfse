import { ProcessRepository, ProcessFilters } from "../../repositories/ProcessRepository";
import { Process, ProcessStatus, PROCESS_STATUSES } from "../../entities/Process";
import { ProcessStep } from "../../entities/ProcessStep";
import { prisma } from "../db/prisma";
import type { Prisma, Process as ProcessDb, ProcessStep as ProcessStepDb } from "@prisma/client";

export class PrismaProcessRepository implements ProcessRepository {
  async save(
    process: Omit<
      Process,
      "id" | "steps" | "clientName" | "supplierName" | "createdAt" | "updatedAt"
    > & { id?: string }
  ): Promise<Process> {
    const data = {
      title: process.title,
      description: process.description ?? null,
      status: this.normalizeStatus(process.status),
      clientId: process.clientId ?? null,
      supplierId: process.supplierId ?? null,
    };

    let result;
    if (process.id) {
      result = await prisma.process.update({ where: { id: process.id }, data });
    } else {
      result = await prisma.process.create({ data });
    }
    return this.mapToEntity(result);
  }

  async findMany(filters?: ProcessFilters): Promise<Process[]> {
    const where: Prisma.ProcessWhereInput = {};
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    if (filters?.status) where.status = filters.status;

    const processes = await prisma.process.findMany({
      where,
      include: {
        steps: { orderBy: { date: "asc" } },
        client: { select: { razaoSocial: true } },
        supplier: { select: { razaoSocial: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return processes.map((p) => this.mapWithRelations(p));
  }

  async findById(id: string): Promise<Process | null> {
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { date: "asc" } },
        client: { select: { razaoSocial: true } },
        supplier: { select: { razaoSocial: true } },
      },
    });
    return process ? this.mapWithRelations(process) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.process.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // ---- Etapas da timeline ----

  async saveStep(step: Omit<ProcessStep, "id" | "createdAt"> & { id?: string }): Promise<ProcessStep> {
    const data = {
      processId: step.processId,
      title: step.title,
      description: step.description ?? null,
      color: step.color,
      date: new Date(step.date),
    };

    let result;
    if (step.id) {
      result = await prisma.processStep.update({ where: { id: step.id }, data });
    } else {
      result = await prisma.processStep.create({ data });
    }
    return this.mapStepToEntity(result);
  }

  async deleteStep(id: string): Promise<boolean> {
    try {
      await prisma.processStep.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // ---- Helpers ----

  private normalizeStatus(status: string): ProcessStatus {
    return (PROCESS_STATUSES as readonly string[]).includes(status)
      ? (status as ProcessStatus)
      : "aberto";
  }

  private mapWithRelations(
    db: ProcessDb & {
      steps: ProcessStepDb[];
      client: { razaoSocial: string } | null;
      supplier: { razaoSocial: string } | null;
    }
  ): Process {
    const base = this.mapToEntity(db);
    return {
      ...base,
      steps: db.steps.map(this.mapStepToEntity),
      clientName: db.client?.razaoSocial ?? null,
      supplierName: db.supplier?.razaoSocial ?? null,
    };
  }

  private mapToEntity(db: ProcessDb): Process {
    return {
      id: db.id,
      title: db.title,
      description: db.description,
      status: this.normalizeStatus(db.status),
      clientId: db.clientId,
      supplierId: db.supplierId,
      steps: [],
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString(),
    };
  }

  private mapStepToEntity(db: ProcessStepDb): ProcessStep {
    return {
      id: db.id,
      processId: db.processId,
      title: db.title,
      description: db.description,
      color: db.color,
      date: db.date.toISOString(),
      createdAt: db.createdAt.toISOString(),
    };
  }
}
