import { SystemErrorCodes } from "@/core/domain/error-codes";
import {
  IPostLoginSyncHandler,
  ISyncHandler,
  SyncStatus,
} from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api/client";
import {
  ActiveCampaignData,
  db,
  PendingOperation,
} from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { PollingService } from "@/core/infrastructure/services/pollingService";
import { SettingsService } from "@/core/infrastructure/services/settingsService";
import { SyncService } from "@/core/infrastructure/services/syncService";
import { dayjs } from "@/lib/dayjs";
import { showError, showInfo, showSuccess } from "@/lib/notifications/toast";
import i18next from "i18next";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "../../../auth/infrastructure/store/authStore";
import {
  ActivateCampaignRequest,
  CreateCampaignRequest,
  DeactivateCampaignRequest,
  UpdateCampaignRequest,
} from "../../domain";
import {
  GetCampaignsResult,
  ICampaignRepository,
} from "../../domain/ICampaignRepository";
import { CampaignFilters, CampaignWithSync } from "../../domain/campaign.types";
import type {
  CampaignResponse,
  PaginatedCampaignsResponse,
} from "../../domain/types/response";
import { useCampaignStore } from "../store/campaignStore";

/**
 * Repository pour la gestion des campagnes
 * Utilise le système de delta counts via PollingService pour optimiser la synchronisation
 */
@injectable()
export class CampaignRepository
  implements ICampaignRepository, ISyncHandler, IPostLoginSyncHandler
{
  public readonly entityType = "campaign";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.PollingService) private pollingService: PollingService
  ) {}

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   * @returns L'ID de l'utilisateur ou null si non connecté
   */
  private getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    const { user } = useAuthStore.getState();
    return user?.id ?? null;
  }

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters?: CampaignFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page !== undefined) {
        params.append("page", filters.page.toString());
      }
      if (filters.limit !== undefined) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.status !== undefined) {
        params.append("status", filters.status);
      }
      if (filters.startDate !== undefined) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate !== undefined) {
        params.append("endDate", filters.endDate);
      }
      if (filters.search !== undefined) {
        params.append("search", filters.search);
      }
    }

    return params;
  }

  /**
   * Transforme une réponse du serveur en Campaign
   */
  private mapResponseToCampaign(response: CampaignResponse): CampaignResponse {
    return {
      id: response.id,
      code: response.code,
      startDate: response.startDate,
      endDate: response.endDate,
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  }

  /**
   * Applique la pagination aux données hors ligne
   * @param allCampaigns - Toutes les campagnes disponibles
   * @param filters - Filtres de pagination
   * @returns Les campagnes paginées
   */
  private applyOfflinePagination(
    allCampaigns: CampaignWithSync[],
    filters?: CampaignFilters
  ): CampaignWithSync[] {
    if (!filters?.page || !filters?.limit) {
      return allCampaigns;
    }

    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;

    return allCampaigns.slice(startIndex, endIndex);
  }

  /**
   * Applique les filtres de recherche aux données hors ligne
   * @param campaigns - Campagnes à filtrer
   * @param filters - Filtres de recherche
   * @returns Les campagnes filtrées
   */
  private applyOfflineSearch(
    campaigns: CampaignWithSync[],
    filters?: CampaignFilters
  ): CampaignWithSync[] {
    let filteredCampaigns = campaigns;

    if (filters?.status) {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.status === filters.status
      );
    }

    if (filters?.startDate) {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.startDate >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.endDate <= filters.endDate!
      );
    }

    if (filters?.search) {
      filteredCampaigns = filteredCampaigns.filter((campaign) =>
        campaign.code?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return filteredCampaigns;
  }

  /**
   * Récupère les campagnes.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Récupère uniquement les opérations en attente depuis le payload des opérations.
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @returns Une promesse résolue avec les campagnes et les métadonnées de pagination
   */
  public async getAll(
    isOnline: boolean,
    filters?: CampaignFilters
  ): Promise<GetCampaignsResult> {
    // EN LIGNE: Récupérer les données du serveur
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = queryParams.toString()
        ? `/campaigns?${queryParams.toString()}`
        : "/campaigns";

      const response = await apiClient.get<PaginatedCampaignsResponse>(url);
      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des campagnes."
        );
      }

      const serverData = response.data;
      const serverCampaigns = serverData.data.map(
        (campaignResponse: CampaignResponse): CampaignWithSync => ({
          ...this.mapResponseToCampaign(campaignResponse),
          syncStatus: SyncStatus.SYNCED,
        })
      );

      return {
        campaigns: serverCampaigns,
        meta: serverData.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll:", error);
      throw new Error(
        "Impossible de récupérer les campagnes depuis le serveur."
      );
    }
  }

  /**
   * Récupère une campagne spécifique par son ID
   * @param id - ID de la campagne à récupérer
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec la campagne
   */
  public async getById(
    id: string,
    isOnline: boolean
  ): Promise<CampaignWithSync> {
    // Si pas d'opération en attente ou si on est OFFLINE (et que l'élément n'est pas en attente)
    // On tente de récupérer depuis le serveur si ONLINE
    if (isOnline) {
      try {
        const response = await apiClient.get<CampaignResponse>(
          `/campaigns/${id}`
        );
        if (!response.success || !response.data) {
          throw new Error("Campagne non trouvée sur le serveur.");
        }
        return {
          ...this.mapResponseToCampaign(response.data),
          syncStatus: SyncStatus.SYNCED,
        };
      } catch {
        throw new Error(
          "Impossible de récupérer la campagne depuis le serveur."
        );
      }
    }

    const userId = this.getCurrentUserId();
    const pendingOperation = await db.pendingOperations
      .where("entityId")
      .equals(id)
      .and((op) => op.userId === userId)
      .first();

    if (pendingOperation) {
      const payload = pendingOperation.payload as Partial<CampaignResponse>;
      return {
        id: pendingOperation.entityId,
        code: payload.code ?? "En attente...",
        startDate: payload.startDate ?? new Date().toISOString(),
        endDate: payload.endDate ?? new Date().toISOString(),
        status: payload.status ?? "inactive",
        createdAt: payload.createdAt ?? new Date().toISOString(),
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
        syncStatus:
          pendingOperation.operation === "create"
            ? SyncStatus.PENDING_CREATION
            : SyncStatus.PENDING_UPDATE,
      };
    } else {
      // Si OFFLINE et pas trouvé dans les pendingOperations, c'est une erreur.
      throw new Error("Campagne non trouvée en mode hors ligne.");
    }
  }

  /**
   * Récupère la campagne actuellement active
   */
  public async getActiveCampaign(
    isOnline: boolean
  ): Promise<CampaignWithSync | null> {
    if (isOnline) {
      try {
        const response = await apiClient.get<CampaignResponse>(
          `/campaigns/active`
        );
        if (!response.success || !response.data) {
          return null;
        }
        return {
          ...this.mapResponseToCampaign(response.data),
          syncStatus: SyncStatus.SYNCED,
        };
      } catch {
        return null;
      }
    }

    // En mode offline, lire la campagne active depuis settings (JSON { id, code })
    const activeSetting = await SettingsService.getActiveCampaign();
    if (activeSetting) {
      return {
        id: activeSetting.id,
        code: activeSetting.code,
        startDate: "",
        endDate: "",
        status: "active",
        createdAt: "",
        updatedAt: "",
        syncStatus: SyncStatus.SYNCED,
      };
    }

    return null;
  }

  /**
   * Ajoute une nouvelle campagne (stockage local + file d'attente de sync)
   */
  public async add(data: CreateCampaignRequest): Promise<void> {
    const localId = uuidv4();
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une opération sans userId"
      );
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...data, id: localId }, // Le payload contient l'ID local pour la reconstruction
    };

    await this.syncService.queueOperation(operation, userId);

    showInfo(i18next.t("campaign:messages.processing"));
  }

  /**
   * Met à jour une campagne existante
   */
  public async update(
    data: UpdateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour une opération sans userId"
      );
    }

    showInfo(i18next.t("campaign:messages.processing"));

    // En mode OFFLINE, on vérifie s'il faut fusionner avec une opération existante
    if (!isOnline) {
      // Filtrer par entityId ET userId pour éviter les conflits entre utilisateurs
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(data.id)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
          ...data,
        };
        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });
        this.syncService.triggerSync();
        return;
      }
    }

    // En mode ONLINE, ou si aucune opération existante en OFFLINE, on crée une nouvelle opération
    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: data.id,
      entityType: this.entityType,
      operation: "update",
      payload: data as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Active une campagne spécifique
   * Cette opération ne peut être effectuée qu'en ligne car elle est critique
   */
  public async activate(
    data: ActivateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    // L'activation ne peut être effectuée qu'en ligne
    if (!isOnline) {
      throw new Error(
        "L'activation d'une campagne n'est possible qu'en ligne."
      );
    }

    // Vérification de l'authentification
    if (!apiClient.getToken()) {
      throw new ApiError(
        SystemErrorCodes.UNAUTHORIZED,
        "Token d'authentification requis pour activer une campagne"
      );
    }

    // Validation des données
    if (!data.id || data.id.trim() === "") {
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "L'ID de la campagne est requis pour l'activation"
      );
    }

    try {
      // Activation directe sur le serveur
      await apiClient.patch<CampaignResponse>(
        `/campaigns/${data.id}/activate`,
        {}
      );
    } catch (error: unknown) {
      console.error("Erreur lors de l'activation sur le serveur:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon, on crée une nouvelle ApiError
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de l'activation de la campagne"
      );
    }
  }

  /**
   * Désactive une campagne spécifique
   * Cette opération ne peut être effectuée qu'en ligne car elle est critique
   */
  public async deactivate(
    data: DeactivateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    // La désactivation ne peut être effectuée qu'en ligne
    if (!isOnline) {
      throw new Error(
        "La désactivation d'une campagne n'est possible qu'en ligne."
      );
    }

    // Vérification de l'authentification
    if (!apiClient.getToken()) {
      throw new ApiError(
        SystemErrorCodes.UNAUTHORIZED,
        "Token d'authentification requis pour désactiver une campagne"
      );
    }

    // Validation des données
    if (!data.id || data.id.trim() === "") {
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "L'ID de la campagne est requis pour la désactivation"
      );
    }

    try {
      // Désactivation directe sur le serveur
      await apiClient.patch<CampaignResponse>(
        `/campaigns/${data.id}/deactivate`,
        {}
      );
    } catch (error: unknown) {
      console.error("Erreur lors de la désactivation sur le serveur:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon, on crée une nouvelle ApiError
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la désactivation de la campagne"
      );
    }
  }

  /**
   * Compte le nombre total de campagnes
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec le nombre total de campagnes
   */
  public async count(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>(
        "/campaigns/count"
      );
      if (!response.success || !response.data) {
        throw new Error("Erreur serveur lors du comptage des campagnes.");
      }
      return response.data.count;
    } catch (error) {
      console.error("Erreur API dans count:", error);
      throw new Error("Impossible de compter les campagnes depuis le serveur.");
    }
  }

  /**
   * Traite les opérations de synchronisation avec le serveur
   * Cette méthode est appelée par le SyncService
   */
  public async handle(operation: PendingOperation): Promise<void> {
    switch (operation.operation) {
      case "create":
        await this.handleCreate(operation);
        break;
      case "update":
        await this.handleUpdate(operation);
        break;
      default:
        throw new Error(`Opération non supportée: ${operation.operation}`);
    }
  }

  private async handleCreate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as CreateCampaignRequest;
    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer une campagne"
        );
      }

      // Validation des données
      if (!payload.startDate || !payload.endDate) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Les dates de début et de fin sont requises"
        );
      }

      await apiClient.post<CampaignResponse>("/campaigns", payload);
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as UpdateCampaignRequest;
    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier une campagne"
        );
      }

      // Validation des données
      if (!payload.id || !payload.startDate || !payload.endDate) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "L'ID et les dates de début et de fin sont requis"
        );
      }

      await apiClient.put<CampaignResponse>(`/campaigns/${payload.id}`, {
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Synchronise les données de campagne active après connexion
   * Utilise le système de delta counts via PollingService pour optimiser la synchronisation
   * Cette méthode est appelée automatiquement après chaque connexion réussie et par le polling
   */
  async syncOnLogin(): Promise<void> {
    console.log("🔑 Synchronisation des campagnes déclenchée...");

    try {
      // Vérifier si on a une campagne active en local
      const currentActiveCampaign = await SettingsService.getActiveCampaign();

      if (!currentActiveCampaign) {
        // ⭐ SYNC INITIALE (première fois - pas de campagne active locale)
        console.log(
          "🔄 Aucune campagne active locale, synchronisation initiale..."
        );
        await this.syncActiveCampaignFromApi();
        console.log(
          "✅ Campagne active synchronisée avec succès (sync initiale)."
        );
        return;
      }

      // ⭐ VÉRIFIER LES DELTA COUNTS (sauvegardés par PollingService)
      const deltaCount = this.pollingService.getEntityCount("campaigns");

      if (deltaCount > 0) {
        console.log(
          `🔄 ${deltaCount} campagne(s) modifiée(s) détectée(s), synchronisation en cours...`
        );
        await this.syncActiveCampaignFromApi();

        // ⭐ RESET DU COUNT APRÈS SYNC RÉUSSIE
        this.pollingService.setEntityCount("campaigns", 0);
        console.log(
          "✅ Campagne active synchronisée avec succès après mise à jour."
        );
      } else {
        console.log("👍 Données de campagne active déjà à jour.");
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation de la campagne active:",
        error
      );
      // Ne pas faire échouer la connexion pour une erreur de campagne
    }
  }

  /**
   * Synchronise la campagne active depuis l'API
   */
  private async syncActiveCampaignFromApi(): Promise<void> {
    try {
      // Récupérer la campagne active depuis l'API
      const response = await apiClient.get<CampaignResponse>(
        "/campaigns/active"
      );

      if (!response.success) {
        throw new Error(
          "Erreur API lors de la récupération de la campagne active"
        );
      }

      if (response.data) {
        await this.saveActiveCampaign(response.data);
        console.log(`✅ Campagne active chargée: ${response.data.code}`);
      } else {
        // Aucune campagne active
        await SettingsService.clearActiveCampaign();
        console.log("🗑️ Aucune campagne active disponible");
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation de la campagne active:",
        error
      );
      throw error;
    }
  }

  /**
   * Sauvegarde une campagne active dans le stockage local
   */
  private async saveActiveCampaign(campaign: CampaignResponse): Promise<void> {
    const activeCampaignData: ActiveCampaignData = {
      id: campaign.id,
      code: campaign.code,
    };

    await SettingsService.setActiveCampaign(activeCampaignData);
    console.log(`💾 Campagne sauvegardée: ${campaign.code} (${campaign.id})`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess(entityType: string, operation: string, entityId: string): void {
    if (entityType === this.entityType) {
      showSuccess(
        i18next.t("campaign:messages.operationSuccess", { operation }),
        {
          duration: 10000,
        }
      );

      if (typeof window !== "undefined") {
        setTimeout(() => {
          useCampaignStore.getState().fetchCampaigns();
        }, 100);
      }
    }
  }

  async onError(
    entityType: string,
    operation: string,
    error: string,
    entityId: string
  ): Promise<void> {
    if (entityType === this.entityType) {
      // Toast immédiat après stockage local
      // recuperer l'entite dans la base de donnees locale a partir de l'entityId
      const userId = this.getCurrentUserId();
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(entityId)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.retries <= 2) {
        showError(
          i18next.t("campaign:messages.operationError", { operation }),
          {
            duration: 10000,
            description: `${error} - ${dayjs(
              existingOperation.payload.startDate as string
            ).format("DD MMM YYYY")} - ${dayjs(
              existingOperation.payload.endDate as string
            ).format("DD MMM YYYY")}`,
          }
        );
      }
    }
  }
}
