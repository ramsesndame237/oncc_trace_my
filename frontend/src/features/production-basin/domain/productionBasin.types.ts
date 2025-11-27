import { ISyncStatus } from "@/core/domain/sync.types";
import { ProductionBasinResponse } from "./types";

/**
 * Modèle de domaine pour un bassin de production
 */
export interface ProductionBasin {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Bassin avec informations de synchronisation pour l'UI
 */
export interface ProductionBasinWithSync extends ProductionBasinResponse {
  localId?: number;
  syncStatus: ISyncStatus;
}

/**
 * Filtres pour la récupération des bassins de production
 */
export interface ProductionBasinFilters {
  page?: number;
  limit?: number;
  search?: string;
  withLocations?: boolean;
  withUsers?: boolean;
}

/**
 * Statistiques des bassins de production
 */
export interface ProductionBasinStats {
  /** Total des bassins */
  total: number;
  
  /** Bassins actifs */
  active: number;
  
  /** Statistiques par statut */
  byStatus: Array<{
    status: string;
    total: number;
  }>;
}
