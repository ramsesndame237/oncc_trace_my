import { ISyncStatus } from "@/core/domain/sync.types";
import { CampaignResponse } from "./types";

/**
 * Modèle de domaine pour une campagne
 */
export interface Campaign {
  id?: string;
  code?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Statut d'une campagne
 */
export enum CampaignStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

/**
 * Campagne avec informations de synchronisation pour l'UI
 */
export interface CampaignWithSync extends CampaignResponse {
  localId?: number;
  syncStatus: ISyncStatus;
  lastError?: {
    code: string;
    message: string;
    timestamp: number;
  };
}

/**
 * Filtres pour la récupération des campagnes
 */
export interface CampaignFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
