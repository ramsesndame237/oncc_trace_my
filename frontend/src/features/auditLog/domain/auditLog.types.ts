import type { PaginationMeta } from "@/core/domain/types";
import type { AuditActionCode } from "./codes";

export interface AuditLogUser {
  id: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
}

export interface AuditLogChangedField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLog {
  id: string;
  auditableType: string;
  auditableId: string;
  action: AuditActionCode;
  formatted_action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changed_fields: AuditLogChangedField[];
  user: AuditLogUser | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  auditableType: string;
  auditableId: string;
  page?: number;
  limit?: number;
}

export interface GetAuditLogsResult {
  logs: AuditLog[];
  meta: PaginationMeta;
}