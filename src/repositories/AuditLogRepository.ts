import { AuditLog, AuditLogFilters, AuditLogPage } from "../entities/AuditLog";

export interface AuditLogRepository {
  create(data: {
    entityType: string;
    entityId: string;
    action: string;
    fieldName?: string;
    oldValue?: string | null;
    newValue?: string | null;
    changedById: string;
    changedByName?: string | null;
  }): Promise<AuditLog>;

  findMany(filters: AuditLogFilters): Promise<AuditLogPage>;
}