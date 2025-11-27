import i18n from "@/i18n/client";
import { showError, showInfo, showSuccess } from "@/lib/notifications/toast";
import { create } from "zustand";
import type {
  Convention,
  ConventionFilters,
  ConventionMeta,
  ConventionWithSync,
} from "../../domain";
import { ConventionServiceProvider } from "../di/conventionServiceProvider";

interface ConventionState {
  conventions: Convention[];
  meta: ConventionMeta | null;
  filters: ConventionFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

interface ConventionStore extends ConventionState {
  setFilters: (filters: Partial<ConventionFilters>) => void;
  fetchConventions: (
    forceOrFilters?: boolean | Partial<ConventionFilters>
  ) => Promise<void>;
  fetchConventionById: (id: string) => Promise<Convention | null>;
  createConvention: (
    conventionData: Omit<ConventionWithSync, "id">
  ) => Promise<void>;
  updateConvention: (
    id: string,
    conventionData: Partial<ConventionWithSync>,
    editOffline?: boolean
  ) => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
}

const initialState: ConventionState = {
  conventions: [],
  meta: null,
  filters: {
    page: 1,
    per_page: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useConventionStore = create<ConventionStore>((set, get) => ({
  ...initialState,

  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };

    // Clean up only null and undefined values, keep empty strings
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key as keyof ConventionFilters];
      if (value === null || value === undefined) {
        delete updatedFilters[key as keyof ConventionFilters];
      }
    });

    set({ filters: updatedFilters });

    // Auto-trigger data refresh
    get().fetchConventions().catch(() => {
      // Silently fail - error already handled in fetchConventions
    });
  },

  fetchConventions: async (forceOrFilters) => {
    const state = get();

    // Déterminer si c'est un force (boolean) ou des filtres
    const isForce =
      typeof forceOrFilters === "boolean" ? forceOrFilters : false;
    const additionalFilters =
      typeof forceOrFilters === "object" ? forceOrFilters : {};

    if (state.isLoading && !isForce) return;

    set({ isLoading: true, error: null });

    try {
      const getConventionsUseCase =
        ConventionServiceProvider.getGetConventionsUseCase();
      const filtersToUse = { ...state.filters, ...additionalFilters };
      const result = await getConventionsUseCase.execute(
        filtersToUse,
        state.isOnline
      );

      set({
        conventions: result.conventions,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des conventions",
        isLoading: false,
      });
    }
  },

  fetchConventionById: async (id: string) => {
    const state = get();

    try {
      const getConventionByIdUseCase =
        ConventionServiceProvider.getGetConventionByIdUseCase();
      const convention = await getConventionByIdUseCase.execute(
        id,
        state.isOnline
      );
      return convention;
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : i18n.t("convention:messages.loadByIdError")
      );
      return null;
    }
  },

  createConvention: async (conventionData) => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const createConventionUseCase =
        ConventionServiceProvider.getCreateConventionUseCase();
      await createConventionUseCase.execute(conventionData, state.isOnline);

      // Afficher un message de succès différent selon le mode
      if (state.isOnline) {
        showSuccess(i18n.t("convention:messages.createdSuccessOnline"));
      } else {
        showInfo(i18n.t("convention:messages.createdSuccessOffline"));
      }

      // Rafraîchir la liste des conventions
      await get().fetchConventions(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n.t("convention:messages.creationError");
      set({ error: errorMessage, isLoading: false });
      showError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateConvention: async (id, conventionData, editOffline) => {
    set({ isLoading: true, error: null });

    try {
      const updateConventionUseCase =
        ConventionServiceProvider.getUpdateConventionUseCase();
      await updateConventionUseCase.execute(id, conventionData, editOffline);

      // Afficher un message de succès
      if (editOffline) {
        showSuccess(i18n.t("convention:messages.updatedSuccessOffline"));
      } else {
        showSuccess(i18n.t("convention:messages.updatedSuccessOnline"));
      }

      // Rafraîchir la liste des conventions si pas en mode editOffline
      if (!editOffline) {
        await get().fetchConventions(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n.t("convention:messages.updateError");
      set({ error: errorMessage, isLoading: false });
      showError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
  },
}));

// Subscribe to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useConventionStore.setState({ isOnline: true });
    useConventionStore.getState().fetchConventions();
  });

  window.addEventListener("offline", () => {
    useConventionStore.setState({ isOnline: false });
  });
}
