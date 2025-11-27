/**
 * Codes d'erreur spécifiques à la validation
 */
export enum ValidationErrorCodes {
  // Données manquantes ou invalides
  REQUIRED_FIELD_MISSING = 'VALIDATION_REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  INVALID_LENGTH = 'VALIDATION_INVALID_LENGTH',
  INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  INVALID_PHONE = 'VALIDATION_INVALID_PHONE',
  INVALID_PASSWORD_FORMAT = 'VALIDATION_INVALID_PASSWORD_FORMAT',
  PASSWORD_CONFIRMATION_MISMATCH = 'VALIDATION_PASSWORD_CONFIRMATION_MISMATCH',
  INVALID_ROLE = 'VALIDATION_INVALID_ROLE',
  INVALID_LANGUAGE = 'VALIDATION_INVALID_LANGUAGE',
  INVALID_STATUS = 'VALIDATION_INVALID_STATUS',
  FAILED = 'VALIDATION_FAILED',

  // OTP et tokens
  INVALID_OTP_FORMAT = 'VALIDATION_INVALID_OTP_FORMAT',
  INVALID_TOKEN_FORMAT = 'VALIDATION_INVALID_TOKEN_FORMAT',
  INVALID_UUID_FORMAT = 'VALIDATION_INVALID_UUID_FORMAT',
}

/**
 * Messages d'erreur en français pour la validation
 */
export const ValidationErrorMessages: Record<ValidationErrorCodes, string> = {
  [ValidationErrorCodes.REQUIRED_FIELD_MISSING]: 'Champ obligatoire manquant',
  [ValidationErrorCodes.INVALID_FORMAT]: 'Format invalide',
  [ValidationErrorCodes.INVALID_LENGTH]: 'Longueur invalide',
  [ValidationErrorCodes.INVALID_EMAIL]: "Format d'email invalide",
  [ValidationErrorCodes.INVALID_PHONE]: 'Format de téléphone invalide',
  [ValidationErrorCodes.INVALID_PASSWORD_FORMAT]:
    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
  [ValidationErrorCodes.PASSWORD_CONFIRMATION_MISMATCH]:
    'La confirmation du mot de passe ne correspond pas',
  [ValidationErrorCodes.INVALID_ROLE]: 'Rôle invalide',
  [ValidationErrorCodes.INVALID_LANGUAGE]: 'Langue invalide',
  [ValidationErrorCodes.INVALID_STATUS]: 'Statut invalide',
  [ValidationErrorCodes.FAILED]: 'Échec de la validation',

  // OTP et tokens
  [ValidationErrorCodes.INVALID_OTP_FORMAT]: 'Le code OTP doit contenir exactement 6 chiffres',
  [ValidationErrorCodes.INVALID_TOKEN_FORMAT]: 'Format de token invalide',
  [ValidationErrorCodes.INVALID_UUID_FORMAT]: 'Format UUID invalide',
}
