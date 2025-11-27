import { ErrorCodes, ErrorMessages, SuccessCodes, SuccessMessages } from '#types/error_codes'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Interface pour les réponses d'erreur standardisées
 */
export interface ErrorResponse {
  success: false
  message: string
  errorCode: ErrorCodes
  details?: any
  timestamp: string
  requestId?: string
}

/**
 * Interface pour les réponses de succès standardisées
 */
export interface SuccessResponse<T = any> {
  success: true
  message: string
  successCode: SuccessCodes
  data?: T
  timestamp: string
  requestId?: string
}

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationErrorResponse {
  success: false
  message: string
  errorCode: ErrorCodes.VALIDATION_REQUIRED_FIELD_MISSING | ErrorCodes.VALIDATION_INVALID_FORMAT
  validationErrors: Array<{
    field: string
    message: string
    value?: any
  }>
  timestamp: string
  requestId?: string
}

/**
 * Utilitaire pour créer des réponses API standardisées
 */
export class ApiResponse {
  /**
   * Génère un ID de requête unique pour le tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Réponse de succès avec code de succès
   */
  static success<T = any>(
    response: HttpContext['response'],
    successCode: SuccessCodes,
    data?: T,
    statusCode: number = 200,
    customMessage?: string
  ) {
    const responseData: SuccessResponse<T> = {
      success: true,
      message: customMessage || SuccessMessages[successCode],
      successCode,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    }

    return response.status(statusCode).json(responseData)
  }

  /**
   * Réponse d'erreur avec code d'erreur
   */
  static error(
    response: HttpContext['response'],
    errorCode: ErrorCodes,
    statusCode: number = 400,
    customMessage?: string,
    details?: any
  ) {
    const responseData: ErrorResponse = {
      success: false,
      message: customMessage || ErrorMessages[errorCode],
      errorCode,
      details,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    }

    return response.status(statusCode).json(responseData)
  }

  /**
   * Réponse d'erreur de validation avec détails des champs
   */
  static validationError(
    response: HttpContext['response'],
    validationErrors: Array<{
      field: string
      message: string
      value?: any
    }>,
    customMessage?: string
  ) {
    const responseData: ValidationErrorResponse = {
      success: false,
      message: customMessage || 'Données de validation invalides',
      errorCode: ErrorCodes.VALIDATION_INVALID_FORMAT,
      validationErrors,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    }

    return response.status(422).json(responseData)
  }

  /**
   * Réponse pour les erreurs de connexion/authentification
   */
  static authError(
    response: HttpContext['response'],
    errorCode: ErrorCodes,
    statusCode: number = 401,
    customMessage?: string
  ) {
    return this.error(response, errorCode, statusCode, customMessage)
  }

  /**
   * Réponse pour les erreurs de permission
   */
  static forbiddenError(
    response: HttpContext['response'],
    errorCode: ErrorCodes = ErrorCodes.SYSTEM_FORBIDDEN,
    customMessage?: string
  ) {
    return this.error(response, errorCode, 403, customMessage)
  }

  /**
   * Réponse pour les ressources non trouvées
   */
  static notFoundError(
    response: HttpContext['response'],
    errorCode: ErrorCodes,
    customMessage?: string
  ) {
    return this.error(response, errorCode, 404, customMessage)
  }

  /**
   * Réponse pour les erreurs internes du serveur
   */
  static serverError(
    response: HttpContext['response'],
    errorCode: ErrorCodes = ErrorCodes.SYSTEM_INTERNAL_ERROR,
    customMessage?: string,
    details?: any
  ) {
    return this.error(response, errorCode, 500, customMessage, details)
  }

  /**
   * Réponse de succès pour la création d'une ressource
   */
  static created<T = any>(
    response: HttpContext['response'],
    successCode: SuccessCodes,
    data?: T,
    customMessage?: string
  ) {
    return this.success(response, successCode, data, 201, customMessage)
  }

  /**
   * Réponse de succès sans contenu (pour les suppression par exemple)
   */
  static noContent(
    response: HttpContext['response'],
    successCode: SuccessCodes,
    customMessage?: string
  ) {
    return this.success(response, successCode, undefined, 204, customMessage)
  }

  /**
   * Helper pour transformer les erreurs de validation Vine
   */
  static fromVineValidationError(
    response: HttpContext['response'],
    vineError: any,
    customMessage?: string
  ) {
    const validationErrors =
      vineError.messages?.map((error: any) => ({
        field: error.field,
        message: error.message,
        value: error.meta?.source_value,
      })) || []

    return this.validationError(response, validationErrors, customMessage)
  }

  /**
   * Helper pour les erreurs basées sur des exceptions
   */
  static fromException(
    response: HttpContext['response'],
    exception: any,
    errorCode: ErrorCodes = ErrorCodes.SYSTEM_INTERNAL_ERROR,
    statusCode: number = 500
  ) {
    // Utiliser le status de l'exception si disponible
    const finalStatusCode = exception.status || statusCode

    // En mode de développement, inclure les détails de l'erreur
    const isDevelopment = process.env.NODE_ENV === 'development'
    const details = isDevelopment
      ? {
          message: exception.message,
          stack: exception.stack,
        }
      : undefined

    return this.error(response, errorCode, finalStatusCode, undefined, details)
  }
}

/**
 * Helper pour créer des réponses paginées
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Utilitaire pour créer des réponses paginées
 */
export class PaginatedApiResponse {
  static success<T>(
    response: HttpContext['response'],
    successCode: SuccessCodes,
    items: T[],
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    },
    customMessage?: string
  ) {
    const paginatedData: PaginatedResponse<T> = {
      items,
      pagination: {
        ...pagination,
        hasNextPage: pagination.currentPage < pagination.totalPages,
        hasPreviousPage: pagination.currentPage > 1,
      },
    }

    return ApiResponse.success(response, successCode, paginatedData, 200, customMessage)
  }
}
