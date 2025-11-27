import { PaginationMeta } from "@/core/domain/types";
import type { ApiResponse } from "@/core/infrastructure/types/api.type";

/**
 * Structure d'une campagne dans les réponses
 */
export interface CampaignResponse {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse paginée pour la liste des campagnes
 */
export interface PaginatedCampaignsResponse {
  data: CampaignResponse[];
  meta: PaginationMeta;
}

/**
 * Réponse pour récupérer la liste des campagnes
 */
export type GetCampaignsResponse = ApiResponse<PaginatedCampaignsResponse>;

/**
 * Réponse pour récupérer une campagne spécifique
 */
export type GetCampaignResponse = ApiResponse<CampaignResponse>;

/**
 * Réponse pour créer une nouvelle campagne
 */
export type CreateCampaignResponse = ApiResponse<CampaignResponse>;

/**
 * Réponse pour modifier une campagne
 */
export type UpdateCampaignResponse = ApiResponse<CampaignResponse>;

/**
 * Réponse pour activer une campagne
 */
export type ActivateCampaignResponse = ApiResponse<CampaignResponse>;
