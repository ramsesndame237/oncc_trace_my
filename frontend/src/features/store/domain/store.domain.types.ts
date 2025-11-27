import { Actor } from "@/core/domain";
import { ISyncStatus } from "@/core/domain/sync.types";
import { BaseEntity, PaginationMeta } from "@/core/domain/types";
import { LocationResponse } from "@/features/location/domain/location.types";

/**
 * Entité Magasin
 */
export interface Store extends BaseEntity {
  /** Nom du magasin */
  name: string;

  /** Code unique du magasin */
  code: string | null;

  /** Capacité du magasin */
  capacity: number | null;

  /** Superficie en m² */
  surfaceArea: number | null;

  /** Type de magasin */
  storeType: StoreType | null;

  /** Statut du magasin (actif si lié à la campagne en cours, inactif sinon) */
  status: StoreStatus;

  /** Code de la localisation */
  locationCode: string;

  /** Localisation associée */
  location?: LocationResponse;

  /** Occupants du magasin (acteurs) */
  occupants?: Actor[];

  /** Campagnes associées */
  campaigns?: StoreCampaign[];

  /** Logs d'audit */
  auditLogs?: StoreAuditLog[];
}

/**
 * Magasin avec statut de synchronisation
 */
export interface StoreWithSync extends Store {
  syncStatus?: ISyncStatus;
}

/**
 * Résultat de la récupération des magasins
 */
export interface GetStoresResult {
  stores: StoreWithSync[];
  meta: PaginationMeta;
}

/**
 * Statut du magasin
 */
export type StoreStatus = "active" | "inactive";

/**
 * Type de magasin
 */
export type StoreType = "EXPORT" | "GROUPING" | "GROUPING_AND_MACHINING";

/**
 * Campagne associée au magasin
 */
export interface StoreCampaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Log d'audit du magasin
 */
export interface StoreAuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Statistiques des magasins
 */
export interface StoreStats {
  /** Total des magasins */
  total: number;

  /** Magasins actifs */
  active: number;

  /** Magasins inactifs */
  inactive: number;
}

/**
 * Filtres de recherche des magasins
 */
export interface StoreFilters {
  /** Terme de recherche (nom ou code) */
  search?: string;

  /** Statut à filtrer */
  status?: StoreStatus;

  /** Page actuelle */
  page?: number;

  /** Nombre d'éléments par page */
  limit?: number;
}

/**
 * Paramètres de recherche d'URL pour les magasins
 */
export interface StoreSearchParams {
  search?: string;
  status?: StoreStatus;
  page?: string;
  limit?: string;
}
