/**
 * Requête pour récupérer la liste des campagnes
 */
export interface GetCampaignsRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Requête pour récupérer une campagne spécifique
 */
export interface GetCampaignRequest {
  id: string;
}

/**
 * Requête pour créer une nouvelle campagne
 */
export interface CreateCampaignRequest {
  startDate: string;
  endDate: string;
}

/**
 * Requête pour activer une campagne
 */
export interface ActivateCampaignRequest {
  id: string;
}

/**
 * Requête pour désactiver une campagne
 */
export interface DeactivateCampaignRequest {
  id: string;
}

/**
 * Requête pour modifier une campagne existante
 */
export interface UpdateCampaignRequest {
  id: string;
  startDate: string;
  endDate: string;
  [key: string]: unknown;
}
