/**
 * Codes d'erreur spécifiques au domaine AuditLog (Historique d'audit)
 */
export enum AuditLogErrorCodes {
  // Récupération des logs
  AUDIT_LOG_LIST_FAILED = 'AUDIT_LOG_LIST_FAILED',
  AUDIT_LOG_NOT_FOUND = 'AUDIT_LOG_NOT_FOUND',
  AUDIT_LOG_DETAILS_FAILED = 'AUDIT_LOG_DETAILS_FAILED',
  AUDIT_LOG_STATS_FAILED = 'AUDIT_LOG_STATS_FAILED',

  // Paramètres invalides
  AUDIT_LOG_INVALID_AUDITABLE_TYPE = 'AUDIT_LOG_INVALID_AUDITABLE_TYPE',
  AUDIT_LOG_INVALID_AUDITABLE_ID = 'AUDIT_LOG_INVALID_AUDITABLE_ID',
  AUDIT_LOG_INVALID_PAGINATION = 'AUDIT_LOG_INVALID_PAGINATION',

  // Autorisations
  AUDIT_LOG_ACCESS_DENIED = 'AUDIT_LOG_ACCESS_DENIED',
  AUDIT_LOG_NOT_AUTHORIZED = 'AUDIT_LOG_NOT_AUTHORIZED',
}

/**
 * Codes de succès spécifiques au domaine AuditLog
 */
export enum AuditLogSuccessCodes {
  AUDIT_LOG_LIST_SUCCESS = 'AUDIT_LOG_LIST_SUCCESS',
  AUDIT_LOG_DETAILS_SUCCESS = 'AUDIT_LOG_DETAILS_SUCCESS',
  AUDIT_LOG_STATS_SUCCESS = 'AUDIT_LOG_STATS_SUCCESS',
}

/**
 * Messages d'erreur spécifiques au domaine AuditLog
 */
export const AuditLogErrorMessages: Record<AuditLogErrorCodes, string> = {
  [AuditLogErrorCodes.AUDIT_LOG_LIST_FAILED]:
    "Échec lors de la récupération de l'historique d'audit",
  [AuditLogErrorCodes.AUDIT_LOG_NOT_FOUND]: "Log d'audit introuvable",
  [AuditLogErrorCodes.AUDIT_LOG_DETAILS_FAILED]:
    "Échec lors de la récupération des détails du log d'audit",
  [AuditLogErrorCodes.AUDIT_LOG_STATS_FAILED]:
    "Échec lors de la récupération des statistiques d'audit",
  [AuditLogErrorCodes.AUDIT_LOG_INVALID_AUDITABLE_TYPE]: "Type d'entité auditable invalide",
  [AuditLogErrorCodes.AUDIT_LOG_INVALID_AUDITABLE_ID]: "Identifiant d'entité auditable invalide",
  [AuditLogErrorCodes.AUDIT_LOG_INVALID_PAGINATION]: 'Paramètres de pagination invalides',
  [AuditLogErrorCodes.AUDIT_LOG_ACCESS_DENIED]: "Accès refusé à l'historique d'audit",
  [AuditLogErrorCodes.AUDIT_LOG_NOT_AUTHORIZED]: "Non autorisé à consulter l'historique d'audit",
}

/**
 * Messages de succès spécifiques au domaine AuditLog
 */
export const AuditLogSuccessMessages: Record<AuditLogSuccessCodes, string> = {
  [AuditLogSuccessCodes.AUDIT_LOG_LIST_SUCCESS]: "Historique d'audit récupéré avec succès",
  [AuditLogSuccessCodes.AUDIT_LOG_DETAILS_SUCCESS]: "Détails du log d'audit récupérés avec succès",
  [AuditLogSuccessCodes.AUDIT_LOG_STATS_SUCCESS]: "Statistiques d'audit récupérées avec succès",
}
