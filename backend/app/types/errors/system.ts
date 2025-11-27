/**
 * Codes d'erreur spécifiques au système
 */
export enum SystemErrorCodes {
  // Erreurs serveur
  INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
  DATABASE_ERROR = 'SYSTEM_DATABASE_ERROR',
  REDIS_ERROR = 'SYSTEM_REDIS_ERROR',
  EMAIL_SERVICE_ERROR = 'SYSTEM_EMAIL_SERVICE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'SYSTEM_EXTERNAL_SERVICE_ERROR',

  // Accès et permissions
  UNAUTHORIZED = 'SYSTEM_UNAUTHORIZED',
  FORBIDDEN = 'SYSTEM_FORBIDDEN',
  RATE_LIMITED = 'SYSTEM_RATE_LIMITED',

  // Configuration
  CONFIG_ERROR = 'SYSTEM_CONFIG_ERROR',
  SERVICE_UNAVAILABLE = 'SYSTEM_SERVICE_UNAVAILABLE',
}

/**
 * Messages d'erreur en français pour le système
 */
export const SystemErrorMessages: Record<SystemErrorCodes, string> = {
  [SystemErrorCodes.INTERNAL_ERROR]: 'Erreur interne du serveur',
  [SystemErrorCodes.DATABASE_ERROR]: 'Erreur de base de données',
  [SystemErrorCodes.REDIS_ERROR]: 'Erreur du service Redis',
  [SystemErrorCodes.EMAIL_SERVICE_ERROR]: "Erreur du service d'email",
  [SystemErrorCodes.EXTERNAL_SERVICE_ERROR]: 'Erreur du service externe',
  [SystemErrorCodes.UNAUTHORIZED]: 'Non autorisé',
  [SystemErrorCodes.FORBIDDEN]: 'Accès interdit',
  [SystemErrorCodes.RATE_LIMITED]: 'Trop de requêtes, veuillez réessayer plus tard',
  [SystemErrorCodes.CONFIG_ERROR]: 'Erreur de configuration',
  [SystemErrorCodes.SERVICE_UNAVAILABLE]: 'Service indisponible',
}
