import {
  SystemErrorCodes,
  ValidationErrorCodes,
} from "@/core/domain/error-codes";
import { ISyncHandler, SyncStatus } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";
import { apiClient, ApiError } from "@/core/infrastructure/api/client";
import { db, PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { SyncService } from "@/core/infrastructure/services/syncService";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "../../../auth/infrastructure/store/authStore";
import {
  CreateProductionBasinRequest,
  UpdateProductionBasinRequest,
} from "../../domain";
import {
  GetProductionBasinsResult,
  IProductionBasinRepository,
} from "../../domain/IProductionBasinRepository";
import {
  ProductionBasinFilters,
  ProductionBasinStats,
  ProductionBasinWithSync,
} from "../../domain/productionBasin.types";
import type {
  PaginatedProductionBasinsResponse,
  ProductionBasinResponse,
} from "../../domain/types/response";

@injectable()
export class ProductionBasinRepository
  implements IProductionBasinRepository, ISyncHandler
{
  public readonly entityType = "productionBasin";

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

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters?: ProductionBasinFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page !== undefined) {
        params.append("page", filters.page.toString());
      }
      if (filters.limit !== undefined) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.search !== undefined && filters.search.trim() !== "") {
        params.append("search", filters.search.trim());
      }
      if (filters.withLocations !== undefined) {
        params.append("with_locations", filters.withLocations.toString());
      }
      if (filters.withUsers !== undefined) {
        params.append("with_users", filters.withUsers.toString());
      }
    }

    return params;
  }

  /**
   * Transforme une réponse du serveur en ProductionBasin
   */
  private mapResponseToProductionBasin(
    response: ProductionBasinResponse
  ): ProductionBasinResponse {
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      locations: response.locations,
      users: response.users,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  }

  /**
   * Génère les métadonnées de pagination pour les données hors ligne
   * @param allBasins - Tous les bassins disponibles hors ligne
   * @param filters - Filtres de pagination appliqués
   * @returns Les métadonnées de pagination calculées
   */
  private generateOfflinePaginationMeta(
    allBasins: ProductionBasinWithSync[],
    filters?: ProductionBasinFilters
  ): PaginationMeta {
    const currentPage = filters?.page ?? 1;
    const perPage = filters?.limit ?? 20;
    const total = allBasins.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const validCurrentPage = Math.min(currentPage, lastPage);

    // Construire les paramètres de base pour les URLs
    const baseParams = new URLSearchParams();
    if (filters?.search) {
      baseParams.append("search", filters.search);
    }
    if (filters?.limit) {
      baseParams.append("limit", filters.limit.toString());
    }

    const buildUrl = (page: number): string => {
      const params = new URLSearchParams(baseParams);
      params.set("page", page.toString());
      return `/production-basins?${params.toString()}`;
    };

    return {
      total,
      perPage: perPage,
      currentPage: validCurrentPage,
      lastPage: lastPage,
      firstPage: 1,
      firstPageUrl: buildUrl(1),
      lastPageUrl: buildUrl(lastPage),
      nextPageUrl:
        validCurrentPage < lastPage ? buildUrl(validCurrentPage + 1) : null,
      previousPageUrl:
        validCurrentPage > 1 ? buildUrl(validCurrentPage - 1) : null,
    };
  }

  /**
   * Récupère les bassins de production.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Récupère uniquement les opérations en attente depuis le payload des opérations.
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @returns Une promesse résolue avec les bassins et les métadonnées de pagination
   */
  public async getAll(
    isOnline: boolean,
    filters?: ProductionBasinFilters
  ): Promise<GetProductionBasinsResult> {
    // EN LIGNE: Récupérer les données du serveur

    try {
      const queryParams = this.buildQueryParams(filters);
      const url = queryParams.toString()
        ? `/production-basins?${queryParams.toString()}`
        : "/production-basins";

      const response = await apiClient.get<PaginatedProductionBasinsResponse>(
        url
      );
      if (!response.success || !response.data) {
        throw new Error("Erreur serveur lors de la récupération des bassins.");
      }

      const serverData = response.data;
      const serverBasins = serverData.data.map(
        (basinResponse: ProductionBasinResponse): ProductionBasinWithSync => ({
          ...this.mapResponseToProductionBasin(basinResponse),
          syncStatus: "synced",
        })
      );

      return {
        basins: serverBasins,
        meta: serverData.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll:", error);
      throw new Error("Impossible de récupérer les bassins depuis le serveur.");
    }
  }

  /**
   * Récupère un bassin spécifique par son ID
   * @param id - ID du bassin à récupérer
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec le bassin
   */
  public async getById(
    id: string,
    isOnline: boolean
  ): Promise<ProductionBasinWithSync> {
    // Si pas d'opération en attente ou si on est OFFLINE (et que l'élément n'est pas en attente)
    // On tente de récupérer depuis le serveur si ONLINE
    if (isOnline) {
      try {
        const response = await apiClient.get<ProductionBasinResponse>(
          `/production-basins/${id}`
        );
        if (!response.success || !response.data) {
          throw new Error("Bassin non trouvé sur le serveur.");
        }
        return {
          ...this.mapResponseToProductionBasin(response.data),
          syncStatus: "synced",
        };
      } catch {
        throw new Error("Impossible de récupérer le bassin depuis le serveur.");
      }
    }

    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error("Utilisateur non connecté");
    }

    const pendingOperation = await db.pendingOperations
      .where("entityId")
      .equals(id)
      .and((op) => op.userId === userId)
      .first();

    if (pendingOperation) {
      const payload =
        pendingOperation.payload as Partial<ProductionBasinResponse> & {
          locationCodes?: string[];
        };
      return {
        id: pendingOperation.entityId,
        name: payload.name ?? "Chargement...",
        description: payload.description ?? "",
        createdAt: payload.createdAt ?? new Date().toISOString(),
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
        locations:
          payload?.locationCodes?.map((code) => ({
            id: code,
            code,
            name: "",
            type: "",
          })) ?? [],
        syncStatus:
          pendingOperation.operation === "create"
            ? SyncStatus.PENDING_CREATION
            : SyncStatus.PENDING_UPDATE,
      };
    } else {
      // Si OFFLINE et pas trouvé dans les pendingOperations, c'est une erreur.
      throw new Error("Bassin non trouvé en mode hors ligne.");
    }
  }

  /**
   * Ajoute un nouveau bassin (stockage local + file d'attente de sync)
   */
  public async add(data: CreateProductionBasinRequest): Promise<void> {
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
  }

  /**
   * Met à jour un bassin existant
   */
  public async update(
    data: UpdateProductionBasinRequest,
    isOnline: boolean
  ): Promise<void> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une opération sans userId"
      );
    }

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
    const payload =
      operation.payload as unknown as CreateProductionBasinRequest;
    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un bassin de production"
        );
      }

      // Validation des données
      if (!payload.name || payload.name.trim() === "") {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "Le nom du bassin de production est requis"
        );
      }

      await apiClient.post<ProductionBasinResponse>(
        "/production-basins",
        payload
      );
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter (y compris les conflicts)
      throw err;
    }
  }

  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload =
      operation.payload as unknown as UpdateProductionBasinRequest;
    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour mettre à jour un bassin de production"
        );
      }

      // Validation des données
      if (!payload.id || payload.id.trim() === "") {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "L'ID du bassin de production est requis pour la mise à jour"
        );
      }

      if (!payload.name || payload.name.trim() === "") {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "Le nom du bassin de production est requis"
        );
      }

      await apiClient.put<ProductionBasinResponse>(
        `/production-basins/${payload.id}`,
        payload
      );
    } catch (err: unknown) {
      // Relancer l'erreur pour que le SyncService puisse la traiter (y compris les conflicts)
      throw err;
    }
  }

  /**
   * Récupère les statistiques des bassins de production
   */
  async getStats(): Promise<ProductionBasinStats> {
    try {
      const response = await apiClient.get<ProductionBasinStats>(
        "/production-basins/stats"
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des statistiques bassins."
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getStats:", error);
      throw new Error(
        "Impossible de récupérer les statistiques des bassins depuis le serveur."
      );
    }
  }
}
