import { SystemErrorCodes } from "@/core/domain/error-codes";
import { type ISyncHandler } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import { db, type PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import i18n from "@/i18n/client";
import { showInfo } from "@/lib/notifications/toast";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type {
  ApiParcelResponse,
  CreateParcelsBulkData,
  CreateParcelsBulkResult,
  GetProducerParcelsFilters,
  IParcelRepository,
  ParcelStatus,
  UpdateParcelData,
} from "../../domain";
import { ParcelErrorCodes, ParcelErrorMessages } from "../../domain";

@injectable()
export class ParcelRepository implements IParcelRepository, ISyncHandler {
  public readonly entityType = "parcel";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService
  ) {}

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return await authService.getCurrentUserId();
  }

  /**
   * Récupère les parcelles d'un producteur.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Récupère depuis le cache local (si disponible).
   * @param filters - Filtres pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec les parcelles et les métadonnées de pagination
   */
  async getProducerParcels(
    filters: GetProducerParcelsFilters,
    isOnline: boolean
  ): Promise<ApiParcelResponse[]> {
    if (!isOnline) {
      // TODO: Implémenter la récupération hors ligne depuis IndexedDB
      throw new ApiError(
        ParcelErrorCodes.PARCEL_NOT_AUTHORIZED,
        "Les parcelles ne sont pas disponibles hors ligne pour le moment."
      );
    }

    try {
      const url = `/producers/${filters.actorId}/parcels`;
      const response = await apiClient.get<ApiParcelResponse[]>(url);

      if (!response.success || !response.data) {
        throw new ApiError(
          ParcelErrorCodes.PARCEL_LIST_FAILED,
          ParcelErrorMessages.PARCEL_LIST_FAILED
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getProducerParcels:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        ParcelErrorCodes.PARCEL_LIST_FAILED,
        ParcelErrorMessages.PARCEL_LIST_FAILED
      );
    }
  }

  /**
   * Récupère les informations d'une parcelle à partir de son ID.
   * - Avec entityId: Charge depuis IndexedDB (pendingOperations).
   * - Sans entityId en ligne: Récupère les données fraîches depuis l'API.
   * - Sans entityId hors ligne: Erreur.
   * @param parcelId - ID de la parcelle à récupérer
   * @param isOnline - Indique si l'application est en ligne
   * @param entityId - ID de l'entité pour charger depuis IndexedDB (optionnel)
   * @returns Une promesse résolue avec les données de la parcelle
   */
  async getById(
    parcelId: string,
    entityId?: string
  ): Promise<ApiParcelResponse> {
    // Si entityId fourni, charger depuis IndexedDB
    if (entityId) {
      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Transformer le payload en ApiParcelResponse
          return {
            id: parcelId,
            producerId: "", // Non disponible dans le payload
            locationCode: (payload.locationCode as string) || "",
            surfaceArea: (payload.surfaceArea as number) || 0,
            parcelCreationDate: (payload.parcelCreationDate as string) || "",
            parcelType:
              (payload.parcelType as
                | "national"
                | "public"
                | "state_private"
                | "individual_private") || "national",
            identificationId: (payload.identificationId as string) || "",
            onccId: (payload.onccId as string) || "",
            status: "active",
            coordinates:
              (
                payload.coordinates as Array<{
                  latitude: number;
                  longitude: number;
                  pointOrder: number;
                }>
              )?.map((coord) => ({
                latitude: coord.latitude,
                longitude: coord.longitude,
                pointOrder: coord.pointOrder,
              })) || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ApiParcelResponse;
        }

        throw new ApiError(
          ParcelErrorCodes.PARCEL_NOT_FOUND,
          "Opération non trouvée dans la base locale"
        );
      } catch (error) {
        console.error("Erreur lors du chargement depuis IndexedDB:", error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          ParcelErrorCodes.PARCEL_NOT_FOUND,
          "Erreur lors du chargement de la parcelle hors ligne"
        );
      }
    }

    // Mode online: charger depuis l'API
    try {
      const url = `/parcels/${parcelId}`;

      const response = await apiClient.get<ApiParcelResponse>(url);

      if (!response.success || !response.data) {
        throw new ApiError(
          ParcelErrorCodes.PARCEL_NOT_FOUND,
          ParcelErrorMessages.PARCEL_NOT_FOUND
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getById:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        ParcelErrorCodes.PARCEL_NOT_FOUND,
        ParcelErrorMessages.PARCEL_NOT_FOUND
      );
    }
  }

  /**
   * Crée plusieurs parcelles en lot pour un producteur.
   * - Pattern offline-first : toutes les opérations passent par IndexedDB puis synchronisation
   * - Supporte la mise à jour d'une opération existante via entityId
   * @param data - Données de création en lot
   * @param entityId - ID de l'entité pour mettre à jour une opération existante (optionnel)
   * @returns Une promesse résolue avec le résultat de la création en lot
   */
  async createParcelsBulk(
    data: CreateParcelsBulkData,
    entityId?: string
  ): Promise<CreateParcelsBulkResult> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new ApiError(
        SystemErrorCodes.UNAUTHORIZED,
        "Utilisateur non connecté"
      );
    }

    showInfo(i18n.t("parcel:messages.processing"));

    // Si entityId est fourni, chercher et mettre à jour l'opération existante
    if (entityId) {
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(entityId)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
          type: data.type, // Préserver le type d'opération
          actorId: data.actorId,
          parcels: data.parcels,
          producerInfo: data.producerInfo, // Préserver les infos du producteur
        };

        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        this.syncService.triggerSync();

        // Retourner un résultat temporaire pour compatibilité
        return {
          created: [],
          errors: [],
        };
      }
    }

    // Si pas d'entityId ou aucune opération existante, on crée une nouvelle opération
    const operationId = uuidv4();

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: operationId,
      entityType: this.entityType,
      operation: "create_bulk",
      payload: data as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);

    // Retourner un résultat temporaire pour compatibilité
    return {
      created: [],
      errors: [],
    };
  }

  /**
   * Met à jour une parcelle.
   * - Pattern offline-first : toutes les opérations passent par IndexedDB puis synchronisation
   * - Supporte la mise à jour d'une opération existante via entityId
   * @param parcelId - ID de la parcelle à mettre à jour
   * @param data - Données de mise à jour
   * @param entityId - ID de l'entité pour mettre à jour une opération existante (optionnel)
   * @returns Une promesse résolue avec la parcelle mise à jour
   */
  async updateParcel(
    parcelId: string,
    data: UpdateParcelData,
    entityId?: string
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new ApiError(
        SystemErrorCodes.UNAUTHORIZED,
        "Utilisateur non connecté"
      );
    }

    showInfo(i18n.t("parcel:messages.processingOne"));

    // Si entityId est fourni, chercher et mettre à jour l'opération existante
    if (entityId) {
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(entityId)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          parcelId,
          ...data,
        };

        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        this.syncService.triggerSync();
      }
    }

    // Si pas d'entityId ou aucune opération existante, on crée une nouvelle opération
    const operationId = uuidv4();

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: operationId,
      entityType: this.entityType,
      operation: "update",
      payload: {
        parcelId,
        ...data,
      } as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Met à jour le statut d'une parcelle (activation ou désactivation).
   * @param parcelId - ID de la parcelle
   * @param status - Nouveau statut ('active' ou 'inactive')
   * @returns Une promesse résolue avec la parcelle mise à jour
   */
  async updateParcelStatus(
    parcelId: string,
    status: ParcelStatus
  ): Promise<ApiParcelResponse> {
    try {
      const url = `/parcels/${parcelId}/status`;

      const response = await apiClient.patch<ApiParcelResponse>(url, {
        status,
      });

      if (!response.success || !response.data) {
        const errorCode =
          status === "active"
            ? ParcelErrorCodes.PARCEL_ACTIVATION_FAILED
            : ParcelErrorCodes.PARCEL_DEACTIVATION_FAILED;
        throw new ApiError(errorCode, ParcelErrorMessages[errorCode]);
      }

      return response.data;
    } catch (error) {
      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError avec le bon code d'erreur
      const errorCode =
        status === "active"
          ? ParcelErrorCodes.PARCEL_ACTIVATION_FAILED
          : ParcelErrorCodes.PARCEL_DEACTIVATION_FAILED;
      throw new ApiError(errorCode, ParcelErrorMessages[errorCode]);
    }
  }

  /**
   * Gère les opérations de synchronisation pour les parcelles
   */
  public async handle(operation: PendingOperation): Promise<void> {
    switch (operation.operation) {
      case "create_bulk":
        await this.handleParcelBulk(operation);
        break;
      case "update":
        await this.handleUpdateParcel(operation);
        break;
      default:
        throw new Error(`Opération non supportée: ${operation.operation}`);
    }
  }

  /**
   * Gère la création de parcelles en masse pour un producteur côté serveur
   */
  private async handleParcelBulk(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as {
      type?: string;
      actorId: string;
      parcels: CreateParcelsBulkData["parcels"];
    };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer des parcelles"
        );
      }

      const url = `/producers/${payload.actorId}/parcels/bulk`;

      // Construire le body de la requête avec le type si présent
      const requestBody: Record<string, unknown> = {
        parcels: payload.parcels,
      };

      // Ajouter le type si présent dans le payload
      if (payload.type) {
        requestBody.type = payload.type;
      }

      await apiClient.post<CreateParcelsBulkResult>(url, requestBody);
    } catch (err) {
      console.log("❌ handleParcelBulk échouée, erreur:", err);
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'une parcelle côté serveur lors de la synchronisation
   */
  private async handleUpdateParcel(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as {
      parcelId: string;
      locationCode?: string;
      surfaceArea?: number;
      parcelType?: string;
      parcelCreationDate?: string;
      identificationId?: string;
      onccId?: string;
      coordinates?: Array<{
        latitude: number;
        longitude: number;
        pointOrder: number;
      }>;
    };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour mettre à jour une parcelle"
        );
      }

      // Exclure parcelId du payload avant l'envoi à l'API
      const { parcelId, ...updateData } = payload;

      const url = `/parcels/${parcelId}`;

      await apiClient.put<ApiParcelResponse>(url, updateData);
    } catch (err) {
      console.log("❌ handleUpdateParcel échouée, erreur:", err);
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }
}
