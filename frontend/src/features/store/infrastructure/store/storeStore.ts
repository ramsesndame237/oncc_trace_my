import { ApiError } from "@/core/infrastructure/api/client";
import {
  getErrorTranslationKey,
  getSuccessTranslationKey,
} from "@/i18n/utils/getErrorMessage";
import { showError, showSuccess } from "@/lib/notifications/toast";
import i18next from "i18next";
import { create } from "zustand";
import { StoreFilters, StoreState, StoreStore } from "../../domain/store.types";
import { StoreServiceProvider } from "../di/storeServiceProvider";

const initialState: StoreState = {
  stores: [],
  meta: null,
  filters: {
    page: 1,
    limit: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useStoreStore = create<StoreStore>((set, get) => ({
  ...initialState,

  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };

    // Clean up only null and undefined values, keep empty strings
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key as keyof StoreFilters];
      if (value === null || value === undefined) {
        delete updatedFilters[key as keyof StoreFilters];
      }
    });

    set({ filters: updatedFilters });

    // Auto-trigger data refresh
    get().fetchStores().catch(console.error);
  },

  fetchStores: async (force = false) => {
    const state = get();
    if (state.isLoading && !force) return;

    set({ isLoading: true, error: null });

    try {
      const getStoresUseCase = StoreServiceProvider.getGetStoresUseCase();
      const result = await getStoresUseCase.execute(
        state.filters,
        state.isOnline
      );

      set({
        stores: result.stores,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching stores:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des magasins",
        isLoading: false,
      });
    }
  },

  fetchStoreById: async (id: string, isOnline?: boolean) => {
    const state = get();
    // Utiliser le paramètre isOnline s'il est fourni, sinon utiliser state.isOnline
    const onlineMode = isOnline !== undefined ? isOnline : state.isOnline;

    try {
      const getStoreByIdUseCase = StoreServiceProvider.getGetStoreByIdUseCase();
      const store = await getStoreByIdUseCase.execute(id, onlineMode);

      return store;
    } catch (error) {
      console.error("Error fetching store by id:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement du magasin",
      });
      return null;
    }
  },

  createStore: async (storeData) => {
    try {
      const createStoreUseCase = StoreServiceProvider.getCreateStoreUseCase();
      await createStoreUseCase.execute(storeData, get().isOnline);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("STORE_CREATED");
      showSuccess(i18next.t(successKey as never));

      // Rafraîchir la liste des magasins
      await get().fetchStores(true);
    } catch (error) {
      console.error("Error creating store:", error);
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      } else {
        const errorKey = getErrorTranslationKey("SYSTEM_UNKNOWN_ERROR");
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      }
      throw error;
    }
  },

  updateStore: async (id: string, storeData, isOnline?: boolean) => {
    try {
      // Ne pas mettre isLoading à true ici car cela bloque fetchStores
      set({ error: null });
      const updateStoreUseCase = StoreServiceProvider.getUpdateStoreUseCase();
      await updateStoreUseCase.execute(id, storeData, isOnline);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("STORE_UPDATED");
      showSuccess(i18next.t(successKey as never));

      // Rafraîchir la liste des magasins pour obtenir le nouvel état
      // Force le rechargement même si isLoading était déjà à true
      await get().fetchStores(true);
    } catch (error) {
      console.error("Error updating store:", error);
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      } else {
        const errorKey = getErrorTranslationKey("SYSTEM_UNKNOWN_ERROR");
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      }
      throw error;
    }
  },

  activateStore: async (storeId: string) => {
    const state = get();
    const isOnline = state.isOnline;

    if (!isOnline) {
      const errorKey = getErrorTranslationKey("SYSTEM_NETWORK_ERROR");
      const message = i18next.t(errorKey as never);
      showError(message);
      throw new Error(message);
    }

    set({ isLoading: true, error: null });

    try {
      const activateStoreUseCase =
        StoreServiceProvider.getActivateStoreUseCase();
      await activateStoreUseCase.execute(storeId);

      // Update the store in the local state
      const updatedStores = state.stores.map((store) =>
        store.id === storeId ? { ...store, status: "active" as const } : store
      );

      set({ stores: updatedStores, isLoading: false });

      // Refresh the list to ensure consistency
      await get().fetchStores(true);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("STORE_ACTIVATED");
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error activating store:", error);
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message, isLoading: false });
      } else {
        const errorKey = getErrorTranslationKey("SYSTEM_UNKNOWN_ERROR");
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message, isLoading: false });
      }
      throw error;
    }
  },

  deactivateStore: async (storeId: string) => {
    const state = get();
    const isOnline = state.isOnline;

    if (!isOnline) {
      const errorKey = getErrorTranslationKey("SYSTEM_NETWORK_ERROR");
      const message = i18next.t(errorKey as never);
      showError(message);
      throw new Error(message);
    }

    set({ isLoading: true, error: null });

    try {
      const deactivateStoreUseCase =
        StoreServiceProvider.getDeactivateStoreUseCase();
      await deactivateStoreUseCase.execute(storeId);

      // Update the store in the local state
      const updatedStores = state.stores.map((store) =>
        store.id === storeId ? { ...store, status: "inactive" as const } : store
      );

      set({ stores: updatedStores, isLoading: false });

      // Refresh the list to ensure consistency
      await get().fetchStores(true);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("STORE_DEACTIVATED");
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error deactivating store:", error);
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message, isLoading: false });
      } else {
        const errorKey = getErrorTranslationKey("SYSTEM_UNKNOWN_ERROR");
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message, isLoading: false });
      }
      throw error;
    }
  },

  removeOccupantFromStore: async (storeId: string, occupantId: string) => {
    const state = get();
    const isOnline = state.isOnline;

    try {
      const removeOccupantUseCase =
        StoreServiceProvider.getRemoveOccupantUseCase();
      await removeOccupantUseCase.execute(storeId, occupantId, isOnline);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("STORE_OCCUPANT_REMOVED");
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error removing occupant:", error);
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      } else {
        const errorKey = getErrorTranslationKey("SYSTEM_UNKNOWN_ERROR");
        const message = i18next.t(errorKey as never);
        showError(message);
        set({ error: message });
      }
      throw error;
    }
  },
}));

// Subscribe to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useStoreStore.setState({ isOnline: true });
    useStoreStore.getState().fetchStores();
  });

  window.addEventListener("offline", () => {
    useStoreStore.setState({ isOnline: false });
  });
}
