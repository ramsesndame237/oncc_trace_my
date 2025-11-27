import { Actor } from "@/core/domain";
import { SystemErrorCodes } from "@/core/domain/error-codes";
import { ISyncHandler, SyncStatus } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api/client";
import { db, type PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { SyncService } from "@/core/infrastructure/services";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "../../../auth/infrastructure/store/authStore";
import {
  GetStoresResult,
  Store,
  StoreFilters,
  StoreStats,
  StoreWithSync,
} from "../../domain";
import type { IStoreRepository } from "../../domain/IStoreRepository";
import { StoreErrorCodes } from "../../domain/types/codes";
import type {
  CreateStoreRequest,
  UpdateStoreRequest,
} from "../../domain/types/request";
import { PaginatedStoresResponse } from "../../domain/types/response";

/**
 * Implémentation du repository pour la gestion des magasins
 */
@injectable()
export class StoreRepository implements IStoreRepository, ISyncHandler {
  public readonly entityType = "store";
  private readonly baseUrl = "/stores";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService
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

  private mapResponseToStore(response: Store): StoreWithSync {
    return {
      id: response.id,
      name: response.name,
      code: response.code,
      capacity: response.capacity,
      surfaceArea: response.surfaceArea,
      storeType: response.storeType,
      status: response.status,
      locationCode: response.locationCode,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      // Map the location structure if present
      location: response.location
        ? {
            ...response.location,
          }
        : undefined,
      // Map the occupants if present
      occupants: response.occupants || undefined,
      // Map the campaigns if present
      campaigns: response.campaigns || undefined,
      // Map the auditLogs if present
      auditLogs: response.auditLogs || undefined,
      syncStatus: SyncStatus.SYNCED,
    };
  }

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters?: StoreFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page !== undefined) {
        params.append("page", filters.page.toString());
      }
      if (filters.limit !== undefined) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.search !== undefined && filters.search !== null) {
        params.append("search", filters.search);
      }
      if (filters.status !== undefined) {
        params.append("status", filters.status);
      }
    }

    return params;
  }

  /**
   * Récupère tous les magasins avec pagination et filtres
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec les magasins et les métadonnées de pagination
   */
  async getAll(
    filters: StoreFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOnline: boolean
  ): Promise<GetStoresResult> {
    // EN LIGNE: Récupérer les données du serveur
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await apiClient.get<PaginatedStoresResponse>(url);

      if (!response.success || !response.data) {
        throw new Error("Erreur serveur lors de la récupération des magasins.");
      }

      const serverData = response.data;

      const stores = serverData.data.map((storeResponse) =>
        this.mapResponseToStore(storeResponse)
      );

      return {
        stores,
        meta: serverData.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll:", error);
      throw new Error(
        "Impossible de récupérer les magasins depuis le serveur."
      );
    }
  }

  async getById(id: string, isOnline: boolean): Promise<StoreWithSync> {
    try {
      if (!id) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "ID du magasin requis"
        );
      }

      if (!isOnline) {
        // Mode offline : récupération depuis les opérations en attente
        const userId = this.getCurrentUserId();

        if (!userId) {
          throw new Error("Utilisateur non connecté");
        }

        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(id)
            .and(
              (op) => op.userId === userId && op.entityType === this.entityType
            )
            .first();

          if (pendingOperation) {
            const payload = pendingOperation.payload as Partial<
              CreateStoreRequest & { id: string }
            >;

            return {
              id: pendingOperation.entityId,
              name: payload.name ?? "",
              code: payload.code || null,
              capacity: payload.capacity || null,
              surfaceArea: payload.surfaceArea || null,
              storeType: payload.storeType ?? "EXPORT",
              status: "inactive", // Les magasins en attente sont inactifs par défaut
              locationCode: payload.locationCode ?? "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              location: undefined,
              occupants: undefined,
              campaigns: undefined,
              auditLogs: undefined,
              syncStatus:
                pendingOperation.operation === "create"
                  ? SyncStatus.PENDING_CREATION
                  : SyncStatus.PENDING_UPDATE,
            };
          } else {
            throw new ApiError(
              SystemErrorCodes.INTERNAL_ERROR,
              "Le magasin est introuvable"
            );
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération offline du magasin:",
            error
          );
          if (error instanceof ApiError) {
            throw error;
          }
          throw new ApiError(
            SystemErrorCodes.INTERNAL_ERROR,
            "Impossible de récupérer le magasin en mode hors ligne"
          );
        }
      }

      // Mode online : récupération depuis l'API
      const response = await apiClient.get<StoreWithSync>(
        `${this.baseUrl}/${id}`
      );

      if (!response.success || !response.data) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Erreur serveur lors de la récupération du magasin."
        );
      }

      return this.mapResponseToStore(response.data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération du magasin"
      );
    }
  }

  async add(
    store: Omit<StoreWithSync, "id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une opération sans userId"
      );
    }

    // Créer les données de requête pour l'API
    const createStoreRequest: CreateStoreRequest = {
      name: store.name,
      code: store.code || undefined,
      storeType: store.storeType || "EXPORT",
      capacity: store.capacity || undefined,
      surfaceArea: store.surfaceArea || undefined,
      locationCode: store.locationCode,
    };

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createStoreRequest, id: localId },
    };

    await this.syncService.queueOperation(operation, userId);
  }

  async update(
    id: string,
    store: Partial<StoreWithSync>,
    isOnline: boolean
  ): Promise<void> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour un magasin sans userId"
      );
    }
    // En mode OFFLINE, on vérifie s'il faut fusionner avec une opération existante
    if (!isOnline) {
      // Filtrer par entityId ET userId pour éviter les conflits entre utilisateurs
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(id)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
          name: store.name,
          code: store.code,
          storeType: store.storeType,
          capacity: store.capacity,
          surfaceArea: store.surfaceArea,
          locationCode: store.locationCode,
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
      entityId: id,
      entityType: this.entityType,
      operation: "update",
      payload: {
        name: store.name,
        code: store.code,
        storeType: store.storeType,
        capacity: store.capacity,
        surfaceArea: store.surfaceArea,
        locationCode: store.locationCode,
      } as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Active un magasin en l'associant à la campagne en cours
   */
  async activate(id: string): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour activer un magasin"
        );
      }

      const response = await apiClient.patch<Store>(
        `${this.baseUrl}/${id}/activate`
      );

      if (!response.success || !response.data) {
        throw new Error("Erreur serveur lors de l'activation du magasin.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        StoreErrorCodes.STORE_ACTIVATION_FAILED,
        "Erreur lors de l'activation du magasin"
      );
    }
  }

  /**
   * Désactive un magasin en supprimant son association avec la campagne en cours
   */
  async deactivate(id: string): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour désactiver un magasin"
        );
      }

      const response = await apiClient.patch<Store>(
        `${this.baseUrl}/${id}/deactivate`
      );

      if (!response.success || !response.data) {
        throw new Error("Erreur serveur lors de la désactivation du magasin.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        StoreErrorCodes.STORE_DEACTIVATION_FAILED,
        "Erreur lors de la désactivation du magasin"
      );
    }
  }

  /**
   * Gère les opérations de synchronisation pour les magasins
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

  /**
   * Gère la création d'un magasin côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as CreateStoreRequest;

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un magasin"
        );
      }

      // Validation des données
      if (!payload.name || !payload.locationCode) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Le nom et le code de localisation sont requis"
        );
      }

      // Nettoyer le payload avant l'envoi pour éviter les valeurs undefined
      const cleanPayload = { ...payload };

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.code || cleanPayload.code.trim() === "") {
        delete cleanPayload.code;
      }

      if (!cleanPayload.capacity || cleanPayload.capacity <= 0) {
        delete cleanPayload.capacity;
      }

      if (!cleanPayload.surfaceArea || cleanPayload.surfaceArea <= 0) {
        delete cleanPayload.surfaceArea;
      }

      await apiClient.post<Store>(`${this.baseUrl}`, cleanPayload);
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'un magasin côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as Partial<UpdateStoreRequest>;

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier un magasin"
        );
      }

      // Validation des données de base
      if (
        !payload.name &&
        !payload.code &&
        !payload.storeType &&
        !payload.capacity &&
        !payload.surfaceArea &&
        !payload.locationCode
      ) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Aucune donnée à mettre à jour"
        );
      }

      // Nettoyer le payload avant l'envoi pour éviter les valeurs undefined
      const cleanPayload = { ...payload };

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.code || cleanPayload.code.trim() === "") {
        delete cleanPayload.code;
      }

      if (!cleanPayload.capacity || cleanPayload.capacity <= 0) {
        delete cleanPayload.capacity;
      }

      if (!cleanPayload.surfaceArea || cleanPayload.surfaceArea <= 0) {
        delete cleanPayload.surfaceArea;
      }

      // Effectuer la mise à jour
      await apiClient.put<Store>(
        `${this.baseUrl}/${operation.entityId}`,
        cleanPayload
      );
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Récupère les statistiques des magasins
   * @returns Les statistiques des magasins
   */
  async getStats(): Promise<StoreStats> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour récupérer les statistiques"
        );
      }

      const response = await apiClient.get<StoreStats>(`${this.baseUrl}/stats`);

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des statistiques."
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getStats:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(
        "Impossible de récupérer les statistiques des magasins depuis le serveur."
      );
    }
  }

  /**
   * Ajoute un occupant (acteur) à un magasin
   */
  async addOccupant(storeId: string, actorId: string): Promise<void> {
    // Mode online : appel API
    try {
      await apiClient.post<void>(`${this.baseUrl}/${storeId}/occupants`, {
        actorId,
      });
    } catch (error) {
      console.error("Erreur API dans addOccupant:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Impossible d'ajouter l'occupant au magasin.");
    }
  }

  /**
   * Retire un occupant (acteur) d'un magasin
   */
  async removeOccupant(storeId: string, actorId: string): Promise<void> {
    // Mode online : appel API
    try {
      await apiClient.delete<void>(
        `${this.baseUrl}/${storeId}/occupants/${actorId}`
      );
    } catch (error) {
      console.error("Erreur API dans removeOccupant:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Impossible de retirer l'occupant du magasin.");
    }
  }

  /**
   * Récupère la liste des occupants d'un magasin
   */
  async getOccupants(storeId: string): Promise<Actor[]> {
    // Mode online : appel API
    try {
      const response = await apiClient.get<Actor[]>(
        `${this.baseUrl}/${storeId}/occupants`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des occupants."
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getOccupants:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(
        "Impossible de récupérer les occupants du magasin depuis le serveur."
      );
    }
  }
}
