import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { create } from "zustand";
import type {
  LocationFilters,
} from "../../domain/location.types";
import type { LocationActions, LocationState } from "../../domain/store.types";

// Interface complète du store
interface LocationStore extends LocationState, LocationActions {}

/**
 * Store Zustand pour la gestion des localisations
 */
export const useLocationStore = create<LocationStore>((set, get) => ({
  // État initial
  locations: [],
  hierarchy: [],
  filters: {},
  isLoading: false,
  isOnline: typeof window !== "undefined" ? navigator?.onLine ?? true : true,
  error: null,
  lastSyncAt: null,
  allLocations: [],

  // Actions synchrones
  setFilters: (newFilters: Partial<LocationFilters>) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };

    // Nettoyer les valeurs vides
    if (updatedFilters.search === "") {
      delete updatedFilters.search;
    }

    if (updatedFilters.parentCode === "") {
      delete updatedFilters.parentCode;
    }

    set({ filters: updatedFilters });

    // Auto-déclencher la récupération des données
    get().fetchLocations(updatedFilters).catch(console.error);
  },

  // Actions asynchrones
  fetchLocations: async (filters?: LocationFilters) => {
    const { isOnline } = get();
    set({ isLoading: true, error: null });

    try {
      const useCase = ServiceProvider.Location.getGetLocationsUseCase();
      const locations = await useCase.execute(isOnline, filters);
      set({ locations, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchAllLocations: async () => {
    const { isOnline } = get();
    set({ isLoading: true, error: null });

    try {
      const useCase = ServiceProvider.Location.getGetLocationsUseCase();
      const locations = await useCase.execute(isOnline, undefined);
      set({ allLocations: locations, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Actions utilitaires
  clearError: () => set({ error: null }),
}));
