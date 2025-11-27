import { PaginationMeta } from "@/core/domain/types";
import { SuccessResponse } from "@/core/infrastructure/types/api.type";
import { Store, StoreStats } from "../store.domain.types";

/**
 * Réponse paginée pour la liste des magasins
 */
export interface PaginatedStoresResponse {
  data: Store[];
  meta: PaginationMeta;
}

/**
 * Réponse pour la liste des magasins
 */
export type GetStoresResponse = SuccessResponse<PaginatedStoresResponse>;

/**
 * Réponse pour un magasin spécifique
 */
export type GetStoreByIdResponse = SuccessResponse<Store>;

/**
 * Réponse pour les statistiques des magasins
 */
export type GetStoreStatsResponse = SuccessResponse<StoreStats>;

/**
 * Réponse pour la création d'un magasin
 */
export type CreateStoreResponse = SuccessResponse<Store>;

/**
 * Réponse pour la mise à jour d'un magasin
 */
export type UpdateStoreResponse = SuccessResponse<Store>;
