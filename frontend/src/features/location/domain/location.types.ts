import { ISyncStatus } from "@/core/domain/sync.types";

/**
 * Réponse de l'API pour une localisation
 */
export interface LocationResponse {
  id: number;
  code: string;
  name: string;
  type: "region" | "department" | "district" | "village";
  status: "active" | "inactive";
  parentCode: string | null;
  isInProductionBasin?: boolean;
  // Nouveaux champs pour support multi-bassins (propagation)
  productionBasinIds?: string[];
  productionBasins?: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  parent?: LocationResponse | null;
  children?: LocationResponse[];
}

/**
 * Localisation avec informations de synchronisation pour l'UI
 */
export interface LocationWithSync extends LocationResponse {
  localId?: number;
  syncStatus: ISyncStatus;
}

/**
 * Filtres pour la récupération des localisations
 */
export interface LocationFilters {
  type?: "region" | "department" | "district" | "village";
  parentCode?: string;
  search?: string;
}

/**
 * Réponse de l'API pour la liste des localisations
 */
export type LocationsApiResponse = LocationResponse[];
