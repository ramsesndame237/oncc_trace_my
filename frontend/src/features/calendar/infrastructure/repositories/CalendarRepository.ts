import { SystemErrorCodes } from "@/core/domain/error-codes";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { ISyncHandler, SyncStatus } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import {
  db,
  type OfflineCalendarData,
  type PendingOperation,
} from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import { idResolutionService } from "@/core/infrastructure/services/idResolutionService";
import type { PollingService } from "@/core/infrastructure/services/pollingService";
import type { ActorWithSync } from "@/features/actor/domain";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import type { CampaignWithSync } from "@/features/campaign";
import type { ConventionWithSync } from "@/features/convention/domain";
import type { LocationWithSync } from "@/features/location";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type {
  CalendarFilters,
  CalendarStatus,
  CalendarWithSync,
  GetCalendarsResult,
} from "../../domain/Calendar";
import type { ICalendarRepository } from "../../domain/ICalendarRepository";
import type {
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from "../../domain/types/request";
import type {
  CalendarResponse,
  PaginatedCalendarsResponse,
} from "../../domain/types/response";

@injectable()
export class CalendarRepository implements ICalendarRepository, ISyncHandler {
  public readonly entityType = "calendar";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.PollingService) private pollingService: PollingService
  ) {
    // ⭐ Enregistrer le callback de changement d'utilisateur
    this.pollingService.onUserChange(async () => {
      await this.clearAllLocalData();
    });
  }

  /**
   * Génère un code local unique pour un calendrier créé offline
   */
  private async generateLocalCalendarCode(
    type: "MARCHE" | "ENLEVEMENT"
  ): Promise<string> {
    const prefix = type === "MARCHE" ? "MAR" : "ENL";
    const COUNTER_KEY = `calendar_local_counter_${type}`;

    const counterSetting = await db.settings
      .where("key")
      .equals(COUNTER_KEY)
      .first();

    let currentCounter = 0;
    if (counterSetting) {
      currentCounter = parseInt(counterSetting.value, 10);
    }

    const nextNumber = currentCounter + 1;
    const paddedNumber = nextNumber.toString().padStart(4, "0");

    if (counterSetting) {
      await db.settings.where("key").equals(COUNTER_KEY).modify({
        value: nextNumber.toString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.settings.add({
        key: COUNTER_KEY,
        value: nextNumber.toString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return `${prefix}-LOCAL-${paddedNumber}`;
  }

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return await authService.getCurrentUserId();
  }

  /**
   * Mappe une réponse API vers un CalendarWithSync
   */
  private mapResponseToCalendar(response: CalendarResponse): CalendarWithSync {
    return {
      id: response.id,
      code: response.code,
      type: response.type,
      startDate: response.startDate,
      endDate: response.endDate,
      eventTime: response.eventTime,
      locationCode: response.locationCode,
      location: response.location,
      campaignId: response.campaignId,
      conventionId: response.conventionId,
      opaId: response.opaId,
      expectedSalesCount: response.expectedSalesCount,
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      deletedAt: response.deletedAt,
      // Relations (partial car API renvoie sous-ensemble)
      campaign: response.campaign as unknown as CampaignWithSync | undefined,
      convention: response.convention as unknown as
        | ConventionWithSync
        | undefined,
      locationRelation: response.locationRelation as unknown as
        | LocationWithSync
        | undefined,
      opa: response.opa as unknown as ActorWithSync | undefined,
      syncStatus: SyncStatus.SYNCED,
    };
  }

  /**
   * Récupère tous les calendriers selon les filtres
   */
  async getAll(
    filters: CalendarFilters,
    isOnline: boolean
  ): Promise<GetCalendarsResult> {
    if (!isOnline) {
      // TODO: Implémenter la récupération offline depuis IndexedDB
      return {
        calendars: [],
        meta: {
          total: 0,
          perPage: filters.per_page || 10,
          currentPage: filters.page || 1,
          lastPage: 1,
          firstPage: 1,
          firstPageUrl: "",
          lastPageUrl: "",
          nextPageUrl: null,
          previousPageUrl: null,
        },
      };
    }

    // Mode online : récupération depuis l'API
    try {
      // Construire les query params
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append("page", filters.page.toString());
      if (filters.per_page)
        queryParams.append("limit", filters.per_page.toString());
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.campaignId)
        queryParams.append("campaignId", filters.campaignId);
      if (filters.conventionId)
        queryParams.append("conventionId", filters.conventionId);
      if (filters.opaId) queryParams.append("opaId", filters.opaId);
      if (filters.locationCode)
        queryParams.append("locationCode", filters.locationCode);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const response = await apiClient.get<PaginatedCalendarsResponse>(
        `/calendars?${queryParams.toString()}`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des calendriers."
        );
      }

      const serverData = response.data;

      const calendars = serverData.data.map((calendar) =>
        this.mapResponseToCalendar(calendar)
      );

      return {
        calendars,
        meta: serverData.meta,
      };
    } catch (error) {
      console.error(
        "[CalendarRepository] Erreur lors de la récupération des calendriers:",
        error
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération des calendriers"
      );
    }
  }

  /**
   * Récupère un calendrier par son ID
   */
  async getById(id: string, isOnline: boolean): Promise<CalendarWithSync> {
    if (!isOnline) {
      // TODO: Implémenter la récupération offline depuis IndexedDB
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Récupération hors ligne non implémentée"
      );
    }

    try {
      const response = await apiClient.get<CalendarResponse>(
        `/calendars/${id}`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération du calendrier."
        );
      }

      // La réponse du backend suit le format ApiResponse standard
      // Les données sont directement dans data
      const calendarData = response.data;

      return this.mapResponseToCalendar(calendarData);
    } catch (error) {
      console.error(
        "[CalendarRepository] Erreur lors de la récupération du calendrier:",
        error
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Erreur lors de la récupération du calendrier");
    }
  }

  /**
   * Crée un nouveau calendrier
   */
  async create(
    payload: CreateCalendarRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer un calendrier sans userId"
      );
    }

    // Créer le payload pour l'API
    const createRequest: CreateCalendarRequest = {
      ...payload,
    };

    // 1. Ajouter dans pendingOperations avec localId
    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createRequest, localId }, // ← Ajouter localId
    };

    await this.syncService.queueOperation(operation, userId);

    // 2. Ajouter le calendrier dans la table locale calendars
    const localCode = await this.generateLocalCalendarCode(payload.type);

    // Récupérer l'OPA pour déterminer serverId vs localId
    const producer = payload.opaId
      ? await db.actors
          .where("serverId")
          .equals(payload.opaId)
          .or("localId")
          .equals(payload.opaId)
          .first()
      : undefined;

    // Récupérer la convention pour déterminer serverId vs localId
    const convention = payload.conventionId
      ? await db.conventions
          .where("serverId")
          .equals(payload.conventionId)
          .or("localId")
          .equals(payload.conventionId)
          .first()
      : undefined;

    const calendarData: OfflineCalendarData = {
      localId,
      serverId: undefined,
      code: localCode, // Code généré localement
      type: payload.type,
      status: payload.status || "active",
      location: payload.location || null,
      locationCode: payload.locationCode || null,
      startDate: payload.startDate,
      endDate: payload.endDate,
      eventTime: payload.eventTime || null,
      // IDs de la convention
      conventionServerId: convention?.serverId,
      conventionLocalId: convention?.localId,
      // IDs de l'OPA (producteur)
      producerServerId: producer?.serverId,
      producerLocalId: producer?.localId,
      syncedAt: Date.now(),
    };

    await db.calendars.add(calendarData);
  }

  /**
   * Met à jour un calendrier
   */
  async update(
    id: string,
    payload: UpdateCalendarRequest,
    editOffline?: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour un calendrier sans userId"
      );
    }

    // En mode editOffline, on met à jour l'opération pendante existante
    if (editOffline) {
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(id)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
        };

        // Mettre à jour les champs fournis
        if (payload.code !== undefined) {
          updatedPayload.code = payload.code;
        }
        if (payload.type !== undefined) {
          updatedPayload.type = payload.type;
        }
        if (payload.startDate !== undefined) {
          updatedPayload.startDate = payload.startDate;
        }
        if (payload.endDate !== undefined) {
          updatedPayload.endDate = payload.endDate;
        }
        if (payload.eventTime !== undefined) {
          updatedPayload.eventTime = payload.eventTime;
        }
        if (payload.locationCode !== undefined) {
          updatedPayload.locationCode = payload.locationCode;
        }
        if (payload.location !== undefined) {
          updatedPayload.location = payload.location;
        }
        if (payload.opaId !== undefined) {
          updatedPayload.opaId = payload.opaId;
        }
        if (payload.campaignId !== undefined) {
          updatedPayload.campaignId = payload.campaignId;
        }
        if (payload.conventionId !== undefined) {
          updatedPayload.conventionId = payload.conventionId;
        }
        if (payload.expectedSalesCount !== undefined) {
          updatedPayload.expectedSalesCount = payload.expectedSalesCount;
        }
        if (payload.status !== undefined) {
          updatedPayload.status = payload.status;
        }

        // Mettre à jour l'opération pendante
        await db.pendingOperations.update(existingOperation.id!, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        // ✅ MISE À JOUR de db.calendars pour le calendrier avec localId
        // Vérifier si c'est un calendrier local (avec localId)
        const calendarInDb = await db.calendars
          .filter((c) => c.localId === id)
          .first();

        if (calendarInDb) {
          // Préparer les champs à mettre à jour
          const updateFields: Partial<typeof calendarInDb> = {};

          if (payload.code !== undefined) {
            updateFields.code = payload.code;
          }
          if (payload.type !== undefined) {
            updateFields.type = payload.type;
          }
          if (payload.startDate !== undefined) {
            updateFields.startDate = payload.startDate;
          }
          if (payload.endDate !== undefined) {
            updateFields.endDate = payload.endDate;
          }
          if (payload.eventTime !== undefined) {
            updateFields.eventTime = payload.eventTime;
          }
          if (payload.locationCode !== undefined) {
            updateFields.locationCode = payload.locationCode;
          }
          if (payload.location !== undefined) {
            updateFields.location = payload.location;
          }
          if (payload.opaId !== undefined) {
            // Récupérer l'OPA pour déterminer serverId vs localId
            const producer = await db.actors
              .where("serverId")
              .equals(payload.opaId)
              .or("localId")
              .equals(payload.opaId)
              .first();
            updateFields.producerServerId = producer?.serverId;
            updateFields.producerLocalId = producer?.localId;
          }
          if (payload.conventionId !== undefined) {
            // Récupérer la convention pour déterminer serverId vs localId
            const convention = await db.conventions
              .where("serverId")
              .equals(payload.conventionId)
              .or("localId")
              .equals(payload.conventionId)
              .first();
            updateFields.conventionServerId = convention?.serverId;
            updateFields.conventionLocalId = convention?.localId;
          }
          if (payload.status !== undefined) {
            updateFields.status = payload.status;
          }

          await db.calendars
            .where("localId")
            .equals(calendarInDb.localId!)
            .modify(updateFields);
        }

        this.syncService.triggerSync();
        return;
      } else {
        throw new Error("Opération pendante non trouvée pour ce calendrier");
      }
    }

    // Mode normal : créer une nouvelle opération de mise à jour
    const updateRequest: Record<string, unknown> = {};

    if (payload.code !== undefined) {
      updateRequest.code = payload.code;
    }
    if (payload.type !== undefined) {
      updateRequest.type = payload.type;
    }
    if (payload.startDate !== undefined) {
      updateRequest.startDate = payload.startDate;
    }
    if (payload.endDate !== undefined) {
      updateRequest.endDate = payload.endDate;
    }
    if (payload.eventTime !== undefined) {
      updateRequest.eventTime = payload.eventTime;
    }
    if (payload.locationCode !== undefined) {
      updateRequest.locationCode = payload.locationCode;
    }
    if (payload.location !== undefined) {
      updateRequest.location = payload.location;
    }
    if (payload.opaId !== undefined) {
      updateRequest.opaId = payload.opaId;
    }
    if (payload.campaignId !== undefined) {
      updateRequest.campaignId = payload.campaignId;
    }
    if (payload.conventionId !== undefined) {
      updateRequest.conventionId = payload.conventionId;
    }
    if (payload.expectedSalesCount !== undefined) {
      updateRequest.expectedSalesCount = payload.expectedSalesCount;
    }
    if (payload.status !== undefined) {
      updateRequest.status = payload.status;
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: id,
      entityType: this.entityType,
      operation: "update",
      payload: updateRequest,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Met à jour le statut d'un calendrier
   */
  async updateStatus(
    id: string,
    code: string,
    status: CalendarStatus
  ): Promise<CalendarWithSync> {
    try {
      const response = await apiClient.patch<CalendarResponse>(
        `/calendars/${id}/status`,
        { code, status }
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la mise à jour du statut du calendrier."
        );
      }

      return this.mapResponseToCalendar(response.data);
    } catch (error) {
      console.error(
        "[CalendarRepository] Erreur lors de la mise à jour du statut:",
        error
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la mise à jour du statut du calendrier"
      );
    }
  }

  /**
   * Met à jour le nombre de ventes attendues d'un calendrier
   */
  async updateExpectedSalesCount(
    id: string,
    code: string,
    expectedSalesCount: number
  ): Promise<CalendarWithSync> {
    try {
      const response = await apiClient.patch<CalendarResponse>(
        `/calendars/${id}/expected-sales-count`,
        { code, expectedSalesCount }
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la mise à jour du nombre de ventes attendues du calendrier."
        );
      }

      return this.mapResponseToCalendar(response.data);
    } catch (error) {
      console.error(
        "[CalendarRepository] Erreur lors de la mise à jour du nombre de ventes attendues:",
        error
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la mise à jour du nombre de ventes attendues du calendrier"
      );
    }
  }

  /**
   * ISyncHandler: Gère les opérations de synchronisation
   */
  async handle(operation: PendingOperation): Promise<void> {
    switch (operation.operation) {
      case "create":
        await this.handleCreate(operation);
        break;
      case "update":
        await this.handleUpdate(operation);
        break;
      default:
        throw new Error(
          `Opération non supportée pour calendar: ${operation.operation}`
        );
    }
  }

  /**
   * Gère la création d'un calendrier côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { localId, ...payload } =
      operation.payload as unknown as CreateCalendarRequest & {
        localId?: string;
      };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un calendrier"
        );
      }

      // Résoudre les IDs (peuvent être localIds ou serverIds)
      const resolvedOpaId = payload.opaId
        ? await idResolutionService.resolveActorId(payload.opaId)
        : undefined;
      const resolvedConventionId = payload.conventionId
        ? await idResolutionService.resolveConventionId(payload.conventionId)
        : undefined;

      // Nettoyer le payload avant l'envoi
      const cleanPayload = {
        ...payload,
        opaId: resolvedOpaId,
        conventionId: resolvedConventionId,
      };

      // Supprimer l'ID local qui n'est pas nécessaire pour l'API
      delete (cleanPayload as Record<string, unknown>).id;
      delete (cleanPayload as Record<string, unknown>).localId;

      // Créer le calendrier
      const response = await apiClient.post<CalendarResponse>(
        "/calendars",
        cleanPayload
      );

      if (!response.success || !response.data) {
        throw new Error("Échec de la création du calendrier");
      }

      const calendarData = response.data;
      const serverId = calendarData.id;

      // Si localId présent, mettre à jour db.calendars
      if (localId) {
        // Mettre à jour db.calendars: ajouter serverId et conserver localId pour traçabilité
        const existingCalendar = await db.calendars
          .where("localId")
          .equals(localId)
          .first();

        if (existingCalendar) {
          // Mettre à jour le calendrier existant (conserve son id auto-généré)
          await db.calendars.update(existingCalendar.id!, {
            serverId: serverId, // Ajouter l'UUID serveur
            localId: undefined, // Conserver le localId pour traçabilité
            code: calendarData.code,
            type: calendarData.type,
            status: calendarData.status,
            location: calendarData.location,
            locationCode: calendarData.locationCode,
            startDate: calendarData.startDate,
            endDate: calendarData.endDate,
            eventTime: calendarData.eventTime,
            conventionServerId: calendarData.convention?.id,
            conventionLocalId: undefined,
            producerServerId: calendarData.opa?.id,
            producerLocalId: undefined,
            syncedAt: Date.now(),
          });
        }
      }
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'un calendrier côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier le calendrier"
        );
      }

      // Résoudre les IDs avant l'envoi (peuvent être localIds ou serverIds)
      const payload = operation.payload as Record<string, unknown>;
      const cleanPayload: Record<string, unknown> = { ...payload };

      // Résoudre l'ID de l'OPA si présent
      if (payload.opaId && typeof payload.opaId === "string") {
        const resolvedOpaId = await idResolutionService.resolveActorId(
          payload.opaId
        );
        cleanPayload.opaId = resolvedOpaId;
      }

      // Résoudre l'ID de la convention si présent
      if (payload.conventionId && typeof payload.conventionId === "string") {
        const resolvedConventionId =
          await idResolutionService.resolveConventionId(payload.conventionId);
        cleanPayload.conventionId = resolvedConventionId;
      }

      // Mettre à jour le calendrier
      const response = await apiClient.put<CalendarResponse>(
        `/calendars/${operation.entityId}`,
        cleanPayload
      );

      if (!response.success || !response.data) {
        throw new Error("Échec de la mise à jour du calendrier");
      }
    } catch (err) {
      throw err;
    }
  }

  // ========================================
  // 🔄 SYNCHRONISATION AVEC L'API
  // ========================================

  /**
   * Vérifie si l'utilisateur a un rôle autorisé pour la synchronisation des calendriers
   * Exclut: technical_admin, transformer
   */
  private hasAuthorizedRole(): boolean {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    return (
      user.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
      user.role === USER_ROLES_CONSTANTS.FIELD_AGENT ||
      user.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER
    );
  }

  /**
   * Récupère le timestamp de la dernière synchronisation
   */
  private getLastSyncTime(): number {
    const storedTime = localStorage.getItem("calendars_last_sync_time");
    return storedTime ? Number.parseInt(storedTime, 10) : 0;
  }

  /**
   * Enregistre le timestamp de la dernière synchronisation
   */
  private setLastSyncTime(timestamp: number): void {
    localStorage.setItem("calendars_last_sync_time", timestamp.toString());
  }

  /**
   * Compte le nombre de calendriers stockés localement
   */
  private async getLocalCount(): Promise<number> {
    return db.calendars.count();
  }

  /**
   * Efface toutes les données locales des calendriers
   * Appelé lors du changement d'utilisateur
   */
  public async clearAllLocalData(): Promise<void> {
    try {
      console.log(
        "🗑️ Effacement de toutes les données locales des calendriers..."
      );
      await db.calendars.clear();
      localStorage.removeItem("calendars_last_sync_time");
      console.log("✅ Données locales des calendriers effacées avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'effacement des calendriers locales:",
        error
      );
      throw error;
    }
  }

  /**
   * Synchronise les calendriers depuis l'API
   * @param isInitialSync true pour sync initiale (tous les calendriers), false pour sync incrémentale
   */
  private async syncFromApi(isInitialSync: boolean): Promise<void> {
    try {
      if (isInitialSync) {
        // ⭐ SYNC INITIALE : Récupérer tous les calendriers
        console.log("📡 Récupération de tous les calendriers...");

        const response = await apiClient.get<{
          calendars: CalendarResponse[];
          total: number;
          syncedAt: number;
        }>("/calendars/sync/all");

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide lors de la sync initiale");
        }

        const serverCalendars = response.data?.calendars || [];
        console.log(
          `📥 ${serverCalendars.length} calendrier(s) reçu(s) du serveur`
        );

        // Mapper les calendriers ACTIFS pour IndexedDB (ignorer les inactifs et ceux sans opaId)
        const calendarsToStore = serverCalendars
          .filter(
            (serverCal) =>
              serverCal.status === "active" && serverCal.opaId !== null
          )
          .map((serverCal: CalendarResponse) => ({
            // id est auto-généré par Dexie (++id)
            serverId: serverCal.id, // UUID serveur
            localId: undefined, // Pas de localId pour les calendriers du serveur
            code: serverCal.code,
            type: serverCal.type,
            status: serverCal.status,
            location: serverCal.location,
            locationCode: serverCal.locationCode,
            startDate: serverCal.startDate,
            endDate: serverCal.endDate,
            eventTime: serverCal.eventTime,
            conventionServerId: serverCal.convention?.id,
            conventionLocalId: undefined,
            producerServerId: serverCal.opa?.id, // opaId → producersId (non-null grâce au filter)
            producerLocalId: undefined,
            syncedAt: Date.now(),
          }));

        await db.calendars.bulkAdd(calendarsToStore);
        console.log(
          `✅ Sync initiale: ${
            calendarsToStore.length
          } calendrier(s) actif(s) stocké(s), ${
            serverCalendars.length - calendarsToStore.length
          } inactif(s) ignoré(s)`
        );
      } else {
        // ⭐ SYNC INCRÉMENTALE : Récupérer uniquement les calendriers modifiés
        const lastSync = this.getLastSyncTime();
        console.log(
          `📡 Récupération des calendriers modifiés depuis ${new Date(
            lastSync
          ).toISOString()}...`
        );

        const response = await apiClient.get<{
          success: boolean;
          data: {
            calendars: CalendarResponse[];
            total: number;
            since: number;
            syncedAt: number;
          };
        }>(`/calendars/sync/updates?since=${lastSync}`);

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide lors de la sync incrémentale");
        }

        const serverCalendars = response.data?.data?.calendars || [];
        console.log(
          `📥 ${serverCalendars.length} calendrier(s) modifié(s) reçu(s) du serveur`
        );

        if (serverCalendars.length > 0) {
          // Pour la sync incrémentale, on doit mettre à jour les entrées existantes
          // en les retrouvant par serverId et en conservant leur id auto-généré
          let addedCount = 0;
          let updatedCount = 0;
          let deletedCount = 0;

          for (const serverCal of serverCalendars) {
            // Chercher le calendrier existant par serverId
            const existingCalendar = await db.calendars
              .where("serverId")
              .equals(serverCal.id)
              .first();

            // Si le calendrier est inactive, le supprimer de la base locale
            if (serverCal.status === "inactive") {
              if (existingCalendar) {
                await db.calendars.delete(existingCalendar.id!);
                deletedCount++;
                console.log(
                  `🗑️ Calendrier ${serverCal.code} (inactive) supprimé de la base locale`
                );
              }
              continue; // Passer au calendrier suivant
            }

            // Si le calendrier est actif
            if (existingCalendar) {
              // Mettre à jour l'entrée existante en conservant son id
              await db.calendars.update(existingCalendar.id!, {
                serverId: serverCal.id,
                code: serverCal.code,
                type: serverCal.type,
                status: serverCal.status,
                location: serverCal.location,
                locationCode: serverCal.locationCode,
                startDate: serverCal.startDate,
                endDate: serverCal.endDate,
                eventTime: serverCal.eventTime,
                conventionServerId: serverCal.convention?.id, // Du serveur = serverId
                conventionLocalId: undefined,
                producerServerId: serverCal.opa?.id, // Du serveur = serverId
                producerLocalId: undefined,
                syncedAt: Date.now(),
              });
              updatedCount++;
            } else {
              // Nouveau calendrier actif, l'ajouter (id sera auto-généré)
              await db.calendars.add({
                serverId: serverCal.id,
                localId: undefined,
                code: serverCal.code,
                type: serverCal.type,
                status: serverCal.status,
                location: serverCal.location,
                locationCode: serverCal.locationCode,
                startDate: serverCal.startDate,
                endDate: serverCal.endDate,
                eventTime: serverCal.eventTime,
                conventionServerId: serverCal.convention?.id, // Du serveur = serverId
                conventionLocalId: undefined,
                producerServerId: serverCal.opa?.id, // Du serveur = serverId
                producerLocalId: undefined,
                syncedAt: Date.now(),
              });
              addedCount++;
            }
          }

          console.log(
            `✅ Sync incrémentale: ${serverCalendars.length} calendrier(s) traité(s) (${addedCount} ajouté(s), ${updatedCount} mis(es) à jour, ${deletedCount} supprimé(s))`
          );
        }
      }

      // ⭐ SAUVEGARDER LE TIMESTAMP DE DERNIÈRE SYNC
      this.setLastSyncTime(Date.now());
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation des calendriers:",
        error
      );
      throw error;
    }
  }

  /**
   * Implémentation de la synchronisation post-connexion
   * Utilise le système de delta counts via PollingService
   * Cette méthode est appelée automatiquement après chaque connexion réussie
   */
  async syncOnLogin(): Promise<void> {
    console.log("🔑 Synchronisation des calendriers déclenchée...");

    try {
      // ⭐ VÉRIFIER LE RÔLE DE L'UTILISATEUR
      if (!this.hasAuthorizedRole()) {
        console.log(
          "⚠️ Utilisateur sans rôle autorisé (technical_admin, transformer exclus) - synchronisation des calendriers ignorée."
        );
        return;
      }

      // Vérifier si nous avons des données locales
      const localCount = await this.getLocalCount();

      if (localCount === 0) {
        // 🆕 PAS DE DONNÉES LOCALES : Effectuer une sync initiale complète
        console.log(
          "🆕 Aucune donnée locale trouvée. Synchronisation initiale en cours..."
        );
        await this.syncFromApi(true);
        console.log("✅ Synchronisation initiale des calendriers terminée");
        return;
      }

      // 📊 DES DONNÉES LOCALES EXISTENT : Vérifier les delta counts
      const deltaCount = this.pollingService.getEntityCount("calendars");
      console.log(
        `📊 Delta count reçu du serveur : ${deltaCount} calendrier(s) modifié(s)`
      );

      if (deltaCount > 0) {
        // 🔄 DES MISES À JOUR DISPONIBLES : Sync incrémentale
        console.log(
          `🔄 ${deltaCount} calendrier(s) modifié(s) détecté(s). Synchronisation incrémentale en cours...`
        );
        await this.syncFromApi(false);

        // ⭐ RÉINITIALISER LE DELTA COUNT APRÈS SYNC
        this.pollingService.setEntityCount("calendars", 0);
        console.log("✅ Synchronisation incrémentale des calendriers terminée");
      } else {
        // ✅ AUCUNE MISE À JOUR : Données locales à jour
        console.log(
          "✅ Les calendriers locaux sont à jour. Aucune synchronisation nécessaire."
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation des calendriers :",
        error
      );
      throw error;
    }
  }
}
