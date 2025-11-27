/**
 * Index des types pour l'API ONCC
 * Exporte tous les types et énumérations nécessaires
 */

export type {
  ErrorResponse,
  PaginatedResponse,
  SuccessResponse,
  ValidationErrorResponse,
} from '../utils/api_response.js'

// Export des codes d'erreur et de succès (compatibilité)
export { ErrorCodes, ErrorMessages, SuccessCodes, SuccessMessages } from './error_codes.js'

// Export des domaines spécifiques (nouveaux développements)
export * from './errors/index.js'

// Export des autres types
export * from './location_types.js'
export * from './user_roles.js'
