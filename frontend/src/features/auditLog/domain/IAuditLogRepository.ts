import type { AuditLogFilters, GetAuditLogsResult } from "./auditLog.types";

export interface IAuditLogRepository {
  getAll(filters: AuditLogFilters, isOnline: boolean): Promise<GetAuditLogsResult>;
}