/**
 * Codes d'erreur et de succès pour la feature AuditLog
 * Alignés avec les codes backend dans /backend/app/types/errors/audit_log.ts
 */

export const AuditLogErrorCodes = {
  // Récupération des logs
  AUDIT_LOG_LIST_FAILED: "AUDIT_LOG_LIST_FAILED",
  AUDIT_LOG_NOT_FOUND: "AUDIT_LOG_NOT_FOUND",
  AUDIT_LOG_DETAILS_FAILED: "AUDIT_LOG_DETAILS_FAILED",
  AUDIT_LOG_STATS_FAILED: "AUDIT_LOG_STATS_FAILED",

  // Paramètres invalides
  AUDIT_LOG_INVALID_AUDITABLE_TYPE: "AUDIT_LOG_INVALID_AUDITABLE_TYPE",
  AUDIT_LOG_INVALID_AUDITABLE_ID: "AUDIT_LOG_INVALID_AUDITABLE_ID",
  AUDIT_LOG_INVALID_PAGINATION: "AUDIT_LOG_INVALID_PAGINATION",

  // Autorisations
  AUDIT_LOG_ACCESS_DENIED: "AUDIT_LOG_ACCESS_DENIED",
  AUDIT_LOG_NOT_AUTHORIZED: "AUDIT_LOG_NOT_AUTHORIZED",
} as const;

export const AuditLogSuccessCodes = {
  AUDIT_LOG_LIST_SUCCESS: "AUDIT_LOG_LIST_SUCCESS",
  AUDIT_LOG_DETAILS_SUCCESS: "AUDIT_LOG_DETAILS_SUCCESS",
  AUDIT_LOG_STATS_SUCCESS: "AUDIT_LOG_STATS_SUCCESS",
} as const;

export type AuditLogErrorCode = keyof typeof AuditLogErrorCodes;
export type AuditLogSuccessCode = keyof typeof AuditLogSuccessCodes;