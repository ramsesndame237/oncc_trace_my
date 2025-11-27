import { ErrorCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour gérer automatiquement les erreurs de validation
 * et les transformer en réponses API standardisées
 */
export default class ValidationErrorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } catch (error) {
      // Intercepter les erreurs de validation Vine
      if (error.messages && Array.isArray(error.messages)) {
        const validationErrors = error.messages.map((validationError: any) => ({
          field: validationError.field,
          message: validationError.message,
          value: validationError.meta?.source_value,
        }))

        return ApiResponse.validationError(ctx.response, validationErrors)
      }

      // Intercepter les erreurs spécifiques de base de données
      if (error.code) {
        // Erreur de contrainte d'unicité PostgreSQL
        if (error.code === '23505') {
          let errorCode = ErrorCodes.VALIDATION_INVALID_FORMAT
          let customMessage = "Violation de contrainte d'unicité"

          // Identifier le champ spécifique basé sur le nom de la contrainte
          if (error.constraint?.includes('email')) {
            errorCode = ErrorCodes.USER_CREATE_EMAIL_EXISTS
          } else if (error.constraint?.includes('pseudo')) {
            errorCode = ErrorCodes.USER_CREATE_PSEUDO_EXISTS
          }

          return ApiResponse.error(ctx.response, errorCode, 400, customMessage)
        }

        // Erreur de contrainte de clé étrangère PostgreSQL
        if (error.code === '23503') {
          return ApiResponse.error(
            ctx.response,
            ErrorCodes.VALIDATION_INVALID_FORMAT,
            400,
            'Référence vers une ressource inexistante'
          )
        }

        // Erreur de contrainte NOT NULL PostgreSQL
        if (error.code === '23502') {
          return ApiResponse.error(
            ctx.response,
            ErrorCodes.VALIDATION_REQUIRED_FIELD_MISSING,
            400,
            'Champ obligatoire manquant'
          )
        }
      }

      // Erreurs d'authentification AdonisJS
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return ApiResponse.authError(ctx.response, ErrorCodes.SYSTEM_UNAUTHORIZED)
      }

      // Erreurs de token invalide
      if (error.code === 'E_INVALID_API_TOKEN') {
        return ApiResponse.authError(ctx.response, ErrorCodes.AUTH_TOKEN_INVALID)
      }

      // Erreurs de ressource non trouvée (ModelNotFoundException)
      if (error.code === 'E_ROW_NOT_FOUND') {
        // Déterminer le type de ressource basé sur le message d'erreur
        if (error.message?.toLowerCase().includes('user')) {
          return ApiResponse.notFoundError(ctx.response, ErrorCodes.USER_NOT_FOUND)
        }

        // Erreur générique de ressource non trouvée
        return ApiResponse.notFoundError(
          ctx.response,
          ErrorCodes.SYSTEM_INTERNAL_ERROR,
          'Ressource non trouvée'
        )
      }

      // Re-lancer l'erreur si elle n'est pas gérée par ce middleware
      throw error
    }
  }
}

/**
 * Configuration pour mapper les erreurs spécifiques aux codes d'erreur
 */
export const ValidationErrorMapping = {
  // Erreurs de validation par champ
  fieldErrors: {
    email: ErrorCodes.VALIDATION_INVALID_EMAIL,
    password: ErrorCodes.VALIDATION_INVALID_PASSWORD_FORMAT,
    telephone: ErrorCodes.VALIDATION_INVALID_PHONE,
    otp: ErrorCodes.VALIDATION_INVALID_OTP_FORMAT,
    role: ErrorCodes.VALIDATION_INVALID_ROLE,
    langue: ErrorCodes.VALIDATION_INVALID_LANGUAGE,
    statut: ErrorCodes.VALIDATION_INVALID_STATUS,
  },

  // Erreurs de base de données par contrainte
  databaseConstraints: {
    users_email_unique: ErrorCodes.USER_CREATE_EMAIL_EXISTS,
    users_pseudo_unique: ErrorCodes.USER_CREATE_PSEUDO_EXISTS,
    foreign_key_violation: ErrorCodes.USER_CREATE_BASSIN_NOT_FOUND,
  },

  // Messages d'erreur personnalisés
  customMessages: {
    [ErrorCodes.VALIDATION_INVALID_EMAIL]: "Format d'email invalide",
    [ErrorCodes.VALIDATION_INVALID_PASSWORD_FORMAT]:
      'Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial',
    [ErrorCodes.VALIDATION_INVALID_OTP_FORMAT]: 'Le code OTP doit contenir exactement 6 chiffres',
    [ErrorCodes.USER_CREATE_EMAIL_EXISTS]: 'Cette adresse email est déjà utilisée',
    [ErrorCodes.USER_CREATE_PSEUDO_EXISTS]: 'Ce pseudo est déjà utilisé',
  },
}
