import { ApiError } from "@/core/infrastructure/api";
import i18next from "@/i18n/client";
import { getErrorTranslationKey } from "@/i18n/utils/getErrorMessage";
import { showError } from "@/lib/notifications/toast";
import { create } from "zustand";
import { ActorFilters, ActorState, ActorStore } from "../../domain";
import { ActorServiceProvider } from "../di/actorServiceProvider";

const initialState: ActorState = {
  actors: [],
  meta: null,
  filters: {
    page: 1,
    per_page: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useActorStore = create<ActorStore>((set, get) => ({
  ...initialState,

  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };

    // Clean up only null and undefined values, keep empty strings
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key as keyof ActorFilters];
      if (value === null || value === undefined) {
        delete updatedFilters[key as keyof ActorFilters];
      }
    });

    set({ filters: updatedFilters });

    // Auto-trigger data refresh
    get().fetchActors().catch(console.error);
  },

  fetchActors: async (forceOrFilters) => {
    const state = get();

    // Déterminer si c'est un force (boolean) ou des filtres
    const isForce =
      typeof forceOrFilters === "boolean" ? forceOrFilters : false;
    const additionalFilters =
      typeof forceOrFilters === "object" ? forceOrFilters : {};

    if (state.isLoading && !isForce) return;

    set({ isLoading: true, error: null });

    try {
      const getActorsUseCase = ActorServiceProvider.getGetActorsUseCase();
      const filtersToUse = { ...state.filters, ...additionalFilters };
      const result = await getActorsUseCase.execute(
        filtersToUse,
        state.isOnline
      );

      set({
        actors: result.actors,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching actors:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  fetchActorById: async (id: string) => {
    const state = get();

    try {
      const getActorByIdUseCase = ActorServiceProvider.getGetActorByIdUseCase();
      const actor = await getActorByIdUseCase.execute(id, state.isOnline);
      return actor;
    } catch (error) {
      console.error(`Error fetching actor ${id}:`, error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      return null;
    }
  },

  createActor: async (actorData) => {
    const state = get();
    set({ isLoading: true });

    try {
      const createActorUseCase = ActorServiceProvider.getCreateActorUseCase();
      await createActorUseCase.execute(actorData, state.isOnline);

      // Rafraîchir la liste des utilisateurs
      await get().fetchActors(true);
    } catch (error) {
      console.error("Error creating actor:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateActor: async (id, actorData, editOffline) => {
    set({ isLoading: true });

    try {
      const updateActorUseCase = ActorServiceProvider.getUpdateActorUseCase();
      await updateActorUseCase.execute(id, actorData, editOffline);

      // Rafraîchir la liste des acteurs
      await get().fetchActors(true);
    } catch (error) {
      console.error("Error updating actor:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateActorStatus: async (id: string, status: "active" | "inactive") => {
    const state = get();
    const isOnline = state.isOnline;

    if (!isOnline) {
      const errorMessage = i18next.t("common:errors.internetRequired");
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    set({ isLoading: true, error: null });

    try {
      const updateActorStatusUseCase =
        ActorServiceProvider.getUpdateActorStatusUseCase();
      await updateActorStatusUseCase.execute(id, status);

      // Update the actor in the local state
      const updatedActors = state.actors.map((actor) =>
        actor.id === id ? { ...actor, status } : actor
      );

      set({ actors: updatedActors, isLoading: false });

      // Refresh the list to ensure consistency
      await get().fetchActors(true);
    } catch (error) {
      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      set({ error: errorMessage, isLoading: false });
      showError(errorMessage);
      throw error;
    }
  },

  addProducerToOpa: async (
    opaId: string,
    producerId: string
  ) => {
    const state = get();

    if (!state.isOnline) {
      const errorMessage = i18next.t("common:errors.internetRequired");
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const addProducerToOpaUseCase = ActorServiceProvider.getAddProducerToOpaUseCase();
      await addProducerToOpaUseCase.execute(opaId, producerId);
    } catch (error) {
      throw error;
    }
  },

  removeProducerFromOpa: async (opaId: string, producerId: string) => {
    const state = get();

    if (!state.isOnline) {
      const errorMessage = i18next.t("common:errors.internetRequired");
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const removeProducerFromOpaUseCase = ActorServiceProvider.getRemoveProducerFromOpaUseCase();
      await removeProducerFromOpaUseCase.execute(opaId, producerId);
    } catch (error) {
      throw error;
    }
  },

  addProducersToOpaBulk: async (data, editOffline) => {
    set({ isLoading: true });

    try {
      // Utiliser le use case pour ajouter les producteurs en masse
      const addProducersToOpaBulkUseCase = ActorServiceProvider.getAddProducersToOpaBulkUseCase();
      await addProducersToOpaBulkUseCase.execute(
        data,
        editOffline === "true"
      );
    } catch (error) {
      console.error("Error adding producers to OPA:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addBuyerToExporter: async (
    exporterId: string,
    buyerId: string
  ) => {
    const state = get();

    if (!state.isOnline) {
      const errorMessage = i18next.t("common:errors.internetRequired");
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const repository = ActorServiceProvider.getRepository();
      await repository.addBuyerToExporter(exporterId, buyerId);
    } catch (error) {
      throw error;
    }
  },

  removeBuyerFromExporter: async (exporterId: string, buyerId: string) => {
    const state = get();

    if (!state.isOnline) {
      const errorMessage = i18next.t("common:errors.internetRequired");
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const repository = ActorServiceProvider.getRepository();
      await repository.removeBuyerFromExporter(exporterId, buyerId);
    } catch (error) {
      throw error;
    }
  },

  getProducerProductions: async (
    producerId: string,
    opaId?: string,
    campaignId?: string
  ) => {
    try {
      const repository = ActorServiceProvider.getRepository();
      const result = await repository.getProducerProductions(
        producerId,
        opaId,
        campaignId
      );
      return result;
    } catch (error) {
      console.error("Error fetching producer productions:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      return null;
    }
  },

  getOpaCollections: async (opaId: string, campaignId?: string) => {
    try {
      const repository = ActorServiceProvider.getRepository();
      const result = await repository.getOpaCollections(opaId, campaignId);
      return result;
    } catch (error) {
      console.error("Error fetching OPA collections:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = i18next.t("common:errors.unknown");
      }

      showError(errorMessage);
      return null;
    }
  },
}));

// Subscribe to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useActorStore.setState({ isOnline: true });
  });

  window.addEventListener("offline", () => {
    useActorStore.setState({ isOnline: false });
  });
}
