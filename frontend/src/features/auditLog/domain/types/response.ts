import type { AuditLog } from "../auditLog.types";
import type { PaginationMeta } from "@/core/domain/types";

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  meta: PaginationMeta;
}