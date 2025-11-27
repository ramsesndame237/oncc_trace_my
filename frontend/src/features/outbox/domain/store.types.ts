/**
 * Types pour le store Zustand de la feature outbox
 * Suit les patterns établis par le store campaign
 */

import { PaginationMeta } from "@/core/domain/types";
import type {
  OutboxFilters,
  OutboxOperationDetails,
  OutboxOperationSummary,
  SyncStatus,
} from "./outbox.types";

// ================================= STORE STATE =================================

export interface OutboxState {
  // Données principales
  operations: OutboxOperationDetails[];
  meta: PaginationMeta | undefined;
  summary: OutboxOperationSummary | undefined;

  // Filtres
  filters: OutboxFilters;

  // États de chargement
  isLoading: boolean;
  isDeleting: boolean;
  isSyncing: boolean;

  // État réseau et synchronisation
  isOnline: boolean;
  syncStatus: SyncStatus;

  // Gestion des erreurs
  error: string | null;

  // Cache et performance
  lastFetch: number | null;
  autoRefreshEnabled: boolean;
}

// ================================= STORE ACTIONS =================================

export interface OutboxActions {
  // === Actions synchrones de mise à jour d'état ===
  setOperations: (operations: OutboxOperationDetails[]) => void;
  setMeta: (meta: PaginationMeta | undefined) => void;
  setSummary: (summary: OutboxOperationSummary | undefined) => void;
  setFilters: (filters: Partial<OutboxFilters>) => void;
  setLoading: (isLoading: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setOnline: (isOnline: boolean) => void;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  setError: (error: string | null) => void;

  // === Actions asynchrones de données ===
  fetchOperations: (filters?: Partial<OutboxFilters>) => Promise<void>;
  refreshOperations: () => Promise<void>;

  // === Actions de gestion des opérations ===
  deleteOperation: (id: number, reason?: string) => Promise<void>;
  retryOperation: (id: number) => Promise<void>;

  // === Actions de synchronisation ===
  forceSyncOperation: () => Promise<void>;
  forceSyncEntityType: (entityType: string) => Promise<void>;
  forceSyncAllOperations: () => Promise<void>;

  // === Actions utilitaires ===
  resetFilters: () => void;
  resetStore: () => void;
  toggleAutoRefresh: (enabled: boolean) => void;

  // === Getters/Selectors ===
  getOperationById: (id: string | number) => OutboxOperationDetails | undefined;
  getFailedOperations: () => OutboxOperationDetails[];
  getPendingOperations: () => OutboxOperationDetails[];
  getOperationsByEntityType: (entityType: string) => OutboxOperationDetails[];
}

// ================================= STORE INTERFACE =================================

export interface OutboxStore extends OutboxState, OutboxActions {}

// ================================= INITIAL STATE =================================

export const initialOutboxState: OutboxState = {
  // Données principales
  operations: [],
  meta: undefined,
  summary: undefined,

  // Filtres
  filters: {
    page: 1,
    limit: 10,
    search: "",
    entityType: "",
    operation: undefined,
    status: "all",
    sort_by: "timestamp",
    sort_order: "desc",
  },

  // États de chargement
  isLoading: false,
  isDeleting: false,
  isSyncing: false,

  // État réseau et synchronisation
  isOnline: typeof window !== "undefined" ? navigator?.onLine ?? true : true,
  syncStatus: {
    isOnline: typeof window !== "undefined" ? navigator?.onLine ?? true : true,
    isSyncing: false,
    syncErrors: [],
  },

  // Gestion des erreurs
  error: null,

  // Cache et performance
  lastFetch: null,
  autoRefreshEnabled: true,
};

// ================================= HOOK RETURN TYPES =================================

export type OutboxStoreHook = OutboxStore;

// ================================= ACTION PAYLOAD TYPES =================================

export type SetFiltersPayload = Partial<OutboxFilters>;
