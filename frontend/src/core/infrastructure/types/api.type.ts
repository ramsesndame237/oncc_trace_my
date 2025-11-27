/**
 * Réponse API de base
 */
export interface BaseApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  requestId: string;
}

/**
 * Réponse de succès
 */
export interface SuccessResponse<T> extends BaseApiResponse {
  success: true;
  successCode: string;
  data: T;
}

/**
 * Réponse d'erreur
 */
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  errorCode: string;
  validationErrors?: ValidationError[];
  details?: Record<string, unknown>; // Contient tous les détails supplémentaires de l'erreur (conflicts, etc.)
}

/**
 * Erreur de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Union type pour toutes les réponses API
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface CheckUpdatesResponse {
  hasUpdates: boolean;
  entities: Record<string, boolean>;
  counts: Record<string, number>;
  serverTime?: number;
  data?: Record<string, unknown>;
}
