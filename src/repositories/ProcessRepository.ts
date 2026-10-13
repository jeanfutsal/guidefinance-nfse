import { Process } from "../entities/Process";
import { ProcessStep } from "../entities/ProcessStep";

export interface ProcessFilters {
  search?: string;
  status?: string;
}

export interface ProcessRepository {
  save(process: Omit<Process, "id" | "steps" | "clientName" | "supplierName" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Process>;
  findMany(filters?: ProcessFilters): Promise<Process[]>;
  findById(id: string): Promise<Process | null>;
  delete(id: string): Promise<boolean>;
  // Etapas da timeline
  saveStep(step: Omit<ProcessStep, "id" | "createdAt"> & { id?: string }): Promise<ProcessStep>;
  deleteStep(id: string): Promise<boolean>;
}
