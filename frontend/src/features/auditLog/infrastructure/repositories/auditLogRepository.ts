import { apiClient, ApiError } from "@/core/infrastructure/api";
import { injectable } from "tsyringe";
import i18next from "i18next";
import { getErrorTranslationKey } from "@/i18n/utils/getErrorMessage";
import {
  AuditLogErrorCodes
} from "../../domain";
import type {
  IAuditLogRepository,
  AuditLogFilters,
  GetAuditLogsResult,
  PaginatedAuditLogsResponse
} from "../../domain";

@injectable()
export class AuditLogRepository implements IAuditLogRepository {
  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters: AuditLogFilters): URLSearchParams {
    const params = new URLSearchParams({
      auditable_type: filters.auditableType,
      auditable_id: filters.auditableId,
    });

    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }

    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }

    return params;
  }

  /**
   * Récupère les logs d'audit.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Non supporté pour les logs d'audit (lecture seule depuis l'API).
   * @param filters - Filtres pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec les logs d'audit et les métadonnées de pagination
   */
  async getAll(filters: AuditLogFilters, isOnline: boolean): Promise<GetAuditLogsResult> {
    if (!isOnline) {
      const errorKey = getErrorTranslationKey(AuditLogErrorCodes.AUDIT_LOG_ACCESS_DENIED);
      const errorMessage = i18next.t(errorKey as never);
      throw new ApiError(
        AuditLogErrorCodes.AUDIT_LOG_ACCESS_DENIED,
        errorMessage
      );
    }

    try {
      const queryParams = this.buildQueryParams(filters);
      const url = `/audit-logs?${queryParams.toString()}`;

      const response = await apiClient.get<PaginatedAuditLogsResponse>(url);

      if (!response.success || !response.data) {
        const errorKey = getErrorTranslationKey(AuditLogErrorCodes.AUDIT_LOG_LIST_FAILED);
        const errorMessage = i18next.t(errorKey as never);
        throw new ApiError(
          AuditLogErrorCodes.AUDIT_LOG_LIST_FAILED,
          errorMessage
        );
      }

      return {
        logs: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll audit logs:", error);
      
      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      const errorKey = getErrorTranslationKey(AuditLogErrorCodes.AUDIT_LOG_LIST_FAILED);
      const errorMessage = i18next.t(errorKey as never);
      throw new ApiError(
        AuditLogErrorCodes.AUDIT_LOG_LIST_FAILED,
        errorMessage
      );
    }
  }
}