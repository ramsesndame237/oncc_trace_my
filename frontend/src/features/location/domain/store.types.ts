import type { LocationFilters, LocationWithSync } from "./location.types";

/**
 * État du store pour les localisations
 */
export interface LocationState {
  locations: LocationWithSync[];
  hierarchy: LocationWithSync[];
  filters: LocationFilters;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  lastSyncAt: number | null;
  allLocations: LocationWithSync[];
}

/**
 * Actions disponibles pour les localisations
 */
export interface LocationActions {
  // Actions synchrones
  setFilters: (filters: Partial<LocationFilters>) => void;

  // Actions asynchrones
  fetchLocations: (filters?: LocationFilters) => Promise<void>;
  fetchAllLocations: () => Promise<void>;

  // Actions utilitaires
  clearError: () => void;
}
