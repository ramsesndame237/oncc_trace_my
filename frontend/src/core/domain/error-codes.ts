/**
 * Codes d'erreur et de succès génériques pour l'application ONCC
 * Codes partagés entre toutes les fonctionnalités
 */

// ======================= CODES D'ERREUR GÉNÉRIQUES =======================

export enum ValidationErrorCodes {
  REQUIRED_FIELD_MISSING = "VALIDATION_REQUIRED_FIELD_MISSING",
  INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",
  INVALID_EMAIL = "VALIDATION_INVALID_EMAIL",
  INVALID_PASSWORD_FORMAT = "VALIDATION_INVALID_PASSWORD_FORMAT",
  INVALID_OTP_FORMAT = "VALIDATION_INVALID_OTP_FORMAT",
}

export enum SystemErrorCodes {
  INTERNAL_ERROR = "SYSTEM_INTERNAL_ERROR",
  UNAUTHORIZED = "SYSTEM_UNAUTHORIZED",
  FORBIDDEN = "SYSTEM_FORBIDDEN",
  DATABASE_ERROR = "SYSTEM_DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "SYSTEM_EXTERNAL_SERVICE_ERROR",
  SERVICE_UNAVAILABLE = "SYSTEM_SERVICE_UNAVAILABLE",
}

export enum ProductionBasinErrorCodes {
  LOCATION_CONFLICTS = "PRODUCTION_BASIN_LOCATION_CONFLICTS",
  REGION_DEPARTMENT_HIERARCHY_CONFLICT = "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT",
  DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT = "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT",
}

/**
 * Union de tous les codes d'erreur génériques
 */
export type GenericErrorCodes = ValidationErrorCodes | SystemErrorCodes | ProductionBasinErrorCodes;

/**
 * Messages d'erreur en français pour la validation
 */
export const ValidationErrorMessages: Record<ValidationErrorCodes, string> = {
  [ValidationErrorCodes.REQUIRED_FIELD_MISSING]: "Champ obligatoire manquant",
  [ValidationErrorCodes.INVALID_FORMAT]: "Format invalide",
  [ValidationErrorCodes.INVALID_EMAIL]: "Format d'email invalide",
  [ValidationErrorCodes.INVALID_PASSWORD_FORMAT]:
    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
  [ValidationErrorCodes.INVALID_OTP_FORMAT]:
    "Le code OTP doit contenir exactement 6 chiffres",
};

/**
 * Messages d'erreur en français pour le système
 */
export const SystemErrorMessages: Record<SystemErrorCodes, string> = {
  [SystemErrorCodes.INTERNAL_ERROR]: "Erreur interne du serveur",
  [SystemErrorCodes.UNAUTHORIZED]: "Non autorisé",
  [SystemErrorCodes.FORBIDDEN]: "Accès interdit",
  [SystemErrorCodes.DATABASE_ERROR]: "Erreur de base de données",
  [SystemErrorCodes.EXTERNAL_SERVICE_ERROR]: "Erreur du service externe",
  [SystemErrorCodes.SERVICE_UNAVAILABLE]: "Service indisponible",
};

/**
 * Messages d'erreur en français pour les bassins de production
 */
export const ProductionBasinErrorMessages: Record<ProductionBasinErrorCodes, string> = {
  [ProductionBasinErrorCodes.LOCATION_CONFLICTS]: "Des conflits de localisation ont été détectés",
  [ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT]: "Impossible d'associer cette région car l'un de ses départements est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT]: "Impossible d'associer ce département car l'un de ses districts est déjà associé à un autre bassin",
};
