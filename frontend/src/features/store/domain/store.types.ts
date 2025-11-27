import { PaginationMeta } from "@/core/domain/types";
import { Store, StoreFilters } from "./store.domain.types";
import { CreateStoreRequest, UpdateStoreRequest } from "./types/request";

/**
 * État du store Zustand pour les magasins
 */
export interface StoreState {
  // Données
  stores: Store[];
  meta: PaginationMeta | null;

  // Filtres
  filters: StoreFilters;

  // États de chargement
  isLoading: boolean;

  // États d'erreur
  error: string | null;

  // État de connexion
  isOnline: boolean;
}

/**
 * Actions du store Zustand pour les magasins
 */
export interface StoreActions {
  // Actions de filtres
  setFilters: (filters: Partial<StoreFilters>) => void;

  // Actions de fonctionnalités
  fetchStores: (force?: boolean) => Promise<void>;
  fetchStoreById: (id: string, isOnline?: boolean) => Promise<Store | null>;
  createStore: (storeData: CreateStoreRequest) => Promise<void>;
  updateStore: (id: string, storeData: Omit<UpdateStoreRequest, 'id'>, isOnline?: boolean) => Promise<void>;
  activateStore: (storeId: string) => Promise<void>;
  deactivateStore: (storeId: string) => Promise<void>;

  // Actions pour les occupants
  removeOccupantFromStore: (storeId: string, occupantId: string) => Promise<void>;
}

/**
 * Type combiné du store Zustand
 */
export type StoreStore = StoreState & StoreActions;

export type { Store, StoreFilters } from "./store.domain.types";
