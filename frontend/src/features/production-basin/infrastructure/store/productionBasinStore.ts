import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import i18next from "i18next";
import { showInfo } from "@/lib/notifications/toast";
import { create } from "zustand";
import {
  CreateProductionBasinRequest,
  UpdateProductionBasinRequest,
} from "../../domain";
import type { ProductionBasinFilters } from "../../domain/productionBasin.types";
import type {
  ProductionBasinActions,
  ProductionBasinState,
} from "../../domain/store.types";

// Interface complète du store
interface ProductionBasinStore
  extends ProductionBasinState,
    ProductionBasinActions {}

/**
 * Store Zustand pour la gestion des bassins de production
 */
export const useProductionBasinStore = create<ProductionBasinStore>(
  (set, get) => ({
    // État initial
    basins: [],
    meta: undefined,
    filters: {
      page: 1,
      limit: 10,
    },
    isLoading: false,
    isOnline: typeof window !== "undefined" ? navigator?.onLine ?? true : true,
    error: null,

    // Actions synchrones
    setFilters: (newFilters: Partial<ProductionBasinFilters>) => {
      const currentFilters = get().filters;
      const updatedFilters = { ...currentFilters, ...newFilters };

      // Nettoyer les valeurs vides pour éviter d'envoyer des paramètres inutiles
      if (updatedFilters.search === "") {
        delete updatedFilters.search;
      }

      set({ filters: updatedFilters });

      // Déclencher automatiquement le rechargement des données
      get().fetchBasins().catch(console.error);
    },

    // Actions asynchrones
    fetchBasins: async () => {
      try {
        set({ isLoading: true, error: null });
        const isOnline: boolean = get().isOnline;
        const filters: ProductionBasinFilters = get().filters;

        const useCase =
          ServiceProvider.ProductionBasin.getGetProductionBasinsUseCase();
        const result = await useCase.execute(isOnline, filters);

        set({
          basins: result.basins,
          meta: result.meta,
          isLoading: false,
        });
      } catch (error: unknown) {
        set({
          error:
            error instanceof Error
              ? error.message
              : i18next.t("productionBasin:errors.loadFailed"),
          isLoading: false,
        });
      }
    },

    createBasin: async (data: CreateProductionBasinRequest) => {
      try {
        set({ isLoading: true, error: null });
        const useCase =
          ServiceProvider.ProductionBasin.getAddProductionBasinUseCase();
        await useCase.execute(data);

        // Toast immédiat après stockage local
        showInfo(i18next.t("productionBasin:toast.processing"));

        // Recharger la liste pour obtenir le nouvel état
        await get().fetchBasins();
      } catch (error: unknown) {
        set({
          error:
            error instanceof Error
              ? error.message
              : i18next.t("productionBasin:errors.createFailed"),
          isLoading: false,
        });
        throw error;
      }
    },

    modifyBasin: async (
      data: UpdateProductionBasinRequest,
      isOnline: boolean
    ) => {
      try {
        set({ isLoading: true, error: null });
        const useCase =
          ServiceProvider.ProductionBasin.getUpdateProductionBasinUseCase();
        await useCase.execute(data, isOnline);

        // Toast immédiat après stockage local
        showInfo(i18next.t("productionBasin:toast.processing"));

        // Recharger la liste pour obtenir le nouvel état
        await get().fetchBasins();
      } catch (error: unknown) {
        set({
          error:
            error instanceof Error
              ? error.message
              : i18next.t("productionBasin:errors.updateFailed"),
          isLoading: false,
        });
        throw error;
      }
    },
  })
);

// Écouter les changements de connexion
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useProductionBasinStore.setState({ isOnline: true });
  });

  window.addEventListener("offline", () => {
    useProductionBasinStore.setState({ isOnline: false });
  });
}
