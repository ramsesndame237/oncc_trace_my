import { ApiError } from "@/core/infrastructure/api/client";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { showError, showInfo } from "@/lib/notifications/toast";
import { create } from "zustand";
import {
  ActivateCampaignRequest,
  CampaignErrorCodes,
  CampaignErrorMessages,
  CampaignResponse,
  CreateCampaignRequest,
  DeactivateCampaignRequest,
  UpdateCampaignRequest,
} from "../../domain";
import type { CampaignFilters } from "../../domain/campaign.types";
import type { CampaignActions, CampaignState } from "../../domain/store.types";

// Interface complète du store
interface CampaignStore extends CampaignState, CampaignActions {}

/**
 * Store Zustand pour la gestion des campagnes
 */
export const useCampaignStore = create<CampaignStore>((set, get) => ({
  // État initial
  campaigns: [],
  meta: undefined,
  filters: {
    page: 1,
    limit: 10,
  },
  totalCampaigns: 0,
  isLoading: false,
  isOnline: typeof window !== "undefined" ? navigator?.onLine ?? true : true,
  error: null,

  // Actions synchrones
  setFilters: (newFilters: Partial<CampaignFilters>) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };

    // Nettoyer les valeurs vides pour éviter d'envoyer des paramètres inutiles
    // if (updatedFilters.status === "") {
    //   delete updatedFilters.status;
    // }
    // if (updatedFilters.startDate === "") {
    //   delete updatedFilters.startDate;
    // }
    // if (updatedFilters.endDate === "") {
    //   delete updatedFilters.endDate;
    // }
    if (updatedFilters.search === "") {
      delete updatedFilters.search;
    }

    set({ filters: updatedFilters });

    // Déclencher automatiquement le rechargement des données
    get().fetchCampaigns().catch(console.error);
  },

  // Actions asynchrones
  fetchCampaigns: async () => {
    try {
      set({ isLoading: true, error: null });
      const isOnline: boolean = get().isOnline;
      const filters: CampaignFilters = get().filters;

      const useCase = ServiceProvider.Campaign.getGetCampaignsUseCase();
      const result = await useCase.execute(isOnline, filters);

      // Mapper les données du repository vers le format store
      const campaigns: CampaignResponse[] = result.campaigns.map(
        (campaign) => ({
          id: campaign.id,
          code: campaign.code,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          status: campaign.status,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        })
      );

      set({
        campaigns,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
        isLoading: false,
      });
    }
  },

  fetchCampaignCount: async () => {
    try {
      const isOnline: boolean = get().isOnline;
      const useCase = ServiceProvider.Campaign.getGetCampaignCountUseCase();
      const count = await useCase.execute(isOnline);

      set({ totalCampaigns: count });
    } catch (error: unknown) {
      console.error("Erreur lors du comptage des campagnes:", error);
    }
  },

  fetchCampaignById: async (id: string) => {
    const state = get();

    try {
      const getCampaignByIdUseCase =
        ServiceProvider.Campaign.getGetCampaignByIdUseCase();
      const campaign = await getCampaignByIdUseCase.execute(id, state.isOnline);
      return campaign;
    } catch (error) {
      console.error("Error fetching campaign by id:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement de la campagne",
      });
      return null;
    }
  },

  createCampaign: async (data: CreateCampaignRequest) => {
    set({ isLoading: true, error: null });
    const useCase = ServiceProvider.Campaign.getCreateCampaignUseCase();
    await useCase.execute(data);

    // Toast immédiat après stockage local
    showInfo("Campagne en cours de traitement...", {
      duration: 3000,
    });

    // Recharger la liste pour obtenir le nouvel état
    await get().fetchCampaigns();
  },

  updateCampaign: async (data: UpdateCampaignRequest) => {
    try {
      set({ isLoading: !!data.isOnline, error: null });
      const useCase = ServiceProvider.Campaign.getUpdateCampaignUseCase();
      const isOnline = !!data.isOnline;
      await useCase.execute(data, isOnline);

      // Recharger la liste pour obtenir le nouvel état
      await get().fetchCampaigns();
    } catch (error: unknown) {
      // Gestion spécifique des erreurs de campagne avec codes
      if (error instanceof ApiError && error.errorCode) {
        const campaignErrorCode = error.errorCode as CampaignErrorCodes;
        const errorMessage =
          CampaignErrorMessages[campaignErrorCode] || error.message;

        showError(errorMessage);
        set({ isLoading: false, error: errorMessage });
        throw error;
      }

      // Autres erreurs
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  activateCampaign: async (data: ActivateCampaignRequest) => {
    try {
      set({ isLoading: true, error: null });
      const isOnline = get().isOnline;

      // Vérifier que l'utilisateur est en ligne
      if (!isOnline) {
        throw new Error(
          "L'activation d'une campagne n'est possible qu'en ligne."
        );
      }

      const useCase = ServiceProvider.Campaign.getActivateCampaignUseCase();
      await useCase.execute(data, isOnline);

      // Recharger la liste pour obtenir le nouvel état
      await get().fetchCampaigns();
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'activation",
        isLoading: false,
      });
      throw error;
    }
  },

  deactivateCampaign: async (data: DeactivateCampaignRequest) => {
    try {
      set({ isLoading: true, error: null });
      const useCase = ServiceProvider.Campaign.getDeactivateCampaignUseCase();
      const isOnline = get().isOnline;
      await useCase.execute(data, isOnline);

      // Recharger la liste pour obtenir le nouvel état
      await get().fetchCampaigns();
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la désactivation",
        isLoading: false,
      });
      throw error;
    }
  },
}));

// Écouter les changements de connexion
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useCampaignStore.setState({ isOnline: true });
  });

  window.addEventListener("offline", () => {
    useCampaignStore.setState({ isOnline: false });
  });
}
