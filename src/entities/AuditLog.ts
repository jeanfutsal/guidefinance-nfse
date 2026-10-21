export interface AuditLog {
  id: string;
  entityType: string; // "Client" | "Supplier" | "Invoice" | "Process" | "Ticket" | "User"
  entityId: string;
  action: string; // "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE"
  fieldName?: string;
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  changedById: string;
  changedByName?: string;
  changedAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  changedById?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // busca em oldValue/newValue/changedByName/entityId
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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