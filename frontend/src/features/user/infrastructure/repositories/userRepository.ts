import type { UserRoles } from "@/core/domain";
import { SystemErrorCodes } from "@/core/domain/error-codes";
import { ISyncHandler, SyncStatus } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import { db, type PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import i18n from "@/i18n/client";
import { showInfo } from "@/lib/notifications/toast";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { PaginatedUsersResponse, UserResponse } from "../../domain/types";
import type {
  CreateUserRequest,
  UpdateSelfRequest,
  UpdateUserRequest,
} from "../../domain/types/request";
import type {
  GetUsersResult,
  UserFilters,
  UserStats,
  UserWithSync,
} from "../../domain/user.types";

@injectable()
export class UserRepository implements IUserRepository, ISyncHandler {
  public readonly entityType = "user";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService
  ) {}

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   * @returns L'ID de l'utilisateur ou null si non connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    return await authService.getCurrentUserId();
  }

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters?: UserFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page !== undefined) {
        params.append("page", filters.page.toString());
      }
      if (filters.per_page !== undefined) {
        params.append("limit", filters.per_page.toString());
      }
      if (filters.search !== undefined && filters.search !== null) {
        params.append("search", filters.search);
      }
      if (filters.role !== undefined) {
        params.append("role", filters.role);
      }
      if (filters.status !== undefined) {
        params.append("status", filters.status);
      }
      if (filters.bassinId !== undefined) {
        params.append("bassinId", filters.bassinId);
      }
    }

    return params;
  }

  private mapResponseToUser(response: UserResponse): UserWithSync {
    return {
      id: response.id,
      role: response.role,
      username: response.username,
      email: response.email,
      phone: response.phone,
      givenName: response.givenName,
      familyName: response.familyName,
      lang: response.lang,
      position: response.position,
      status: response.status,
      productionBasinId: response.productionBasinId,
      actorId: response.actorId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      // Map the productionBasin structure
      productionBasin: response.productionBasin
        ? {
            id: response.productionBasin.id,
            name: response.productionBasin.name,
            description: response.productionBasin.description || "",
          }
        : undefined,
      // Map the actor structure
      actor: response.actor
        ? {
            id: response.actor.id,
            actorType: response.actor.actorType,
            familyName: response.actor.familyName,
            givenName: response.actor.givenName,
          }
        : undefined,
      syncStatus: SyncStatus.SYNCED,
    };
  }

  /**
   * Récupère les utilisateurs.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Récupère uniquement les opérations en attente depuis le payload des opérations.
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec les utilisateurs et les métadonnées de pagination
   */
  async getAll(
    filters: UserFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOnline: boolean
  ): Promise<GetUsersResult> {
    // EN LIGNE: Récupérer les données du serveur
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = queryParams.toString()
        ? `/users?${queryParams.toString()}`
        : "/users";

      const response = await apiClient.get<PaginatedUsersResponse>(url);

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des utilisateurs."
        );
      }

      const serverData = response.data;

      const users = serverData.data.map((userResponse) => ({
        ...this.mapResponseToUser(userResponse),
        fullName: `${userResponse.familyName} ${userResponse.givenName}`,
      }));

      return {
        users,
        meta: serverData.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll:", error);
      throw new Error(
        "Impossible de récupérer les utilisateurs depuis le serveur."
      );
    }
  }

  async getById(id: string, isOnline: boolean): Promise<UserWithSync> {
    if (!isOnline) {
      // Mode offline : récupération depuis les opérations en attente
      const userId = await this.getCurrentUserId();

      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(id)
          .and((op) => op.userId === userId)
          .first();

        if (pendingOperation) {
          const payload = pendingOperation.payload as Partial<UserResponse>;

          return {
            id: pendingOperation.entityId,
            username: payload.username ?? "Utilisateur",
            familyName: payload.familyName ?? "",
            givenName: payload.givenName ?? "",
            email: payload.email ?? "",
            phone: payload.phone || undefined,
            role: (payload.role as UserRoles) ?? "field_agent",
            lang: payload.lang ?? "fr",
            status: payload.status ?? "active",
            productionBasinId: payload.productionBasinId || undefined,
            productionBasin: payload.productionBasin || undefined,
            fullName:
              `${payload.givenName ?? ""} ${payload.familyName ?? ""}`.trim() ||
              (payload.username ?? "Utilisateur"),
            createdAt: payload.createdAt ?? new Date().toISOString(),
            updatedAt: payload.updatedAt ?? new Date().toISOString(),
            lastLoginAt: payload.lastLoginAt || undefined,
            syncStatus:
              pendingOperation.operation === "create"
                ? SyncStatus.PENDING_CREATION
                : SyncStatus.PENDING_UPDATE,
          };
        } else {
          throw new Error("Utilisateur non trouvé en mode hors ligne");
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération offline de l'utilisateur:",
          error
        );
        throw new Error(
          "Impossible de récupérer l'utilisateur en mode hors ligne"
        );
      }
    }

    // Mode online : récupération depuis l'API
    try {
      const response = await apiClient.get<UserResponse>(`/users/${id}`);

      if (!response.success || !response.data) {
        throw new Error("Utilisateur non trouvé sur le serveur.");
      }

      return {
        ...this.mapResponseToUser(response.data),
        fullName: `${response.data.familyName} ${response.data.givenName}`,
        syncStatus: SyncStatus.SYNCED,
      };
    } catch (error) {
      console.error("Error fetching user by id:", error);
      throw error;
    }
  }

  /**
   * Ajoute un nouvel utilisateur (stockage local + file d'attente de sync)
   */
  async add(
    user: Omit<UserWithSync, "id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une opération sans userId"
      );
    }

    // Créer les données de requête pour l'API
    const createUserRequest: CreateUserRequest = {
      familyName: user.familyName,
      givenName: user.givenName,
      email: user.email,
      role: user.role,
      lang: user.lang || "fr",
    };

    // Ajouter les champs optionnels s'ils sont présents
    if (user.phone && user.phone.trim() !== "") {
      createUserRequest.phone = user.phone;
    }

    if (user.productionBasinId && user.productionBasinId.trim() !== "") {
      createUserRequest.productionBasinId = user.productionBasinId;
    }

    if (user.position && user.position.trim() !== "") {
      createUserRequest.position = user.position;
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createUserRequest, id: localId }, // Le payload contient l'ID local pour la reconstruction
    };

    await this.syncService.queueOperation(operation, userId);

    showInfo(i18n.t("user:messages.processing"));
  }

  async update(
    id: string,
    user: Partial<UserWithSync>,
    isOnline: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour un utilisateur sans userId"
      );
    }

    showInfo(i18n.t("user:messages.processing"));

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
        };

        // Mettre à jour seulement les champs fournis
        if (user.familyName !== undefined) {
          updatedPayload.familyName = user.familyName;
        }
        if (user.givenName !== undefined) {
          updatedPayload.givenName = user.givenName;
        }
        if (user.email !== undefined) {
          updatedPayload.email = user.email;
        }
        if (user.role !== undefined) {
          updatedPayload.role = user.role;
        }
        if (user.lang !== undefined) {
          updatedPayload.lang = user.lang;
        }

        // Gestion des champs optionnels
        if (user.phone !== undefined) {
          if (user.phone && user.phone.trim() !== "") {
            updatedPayload.phone = user.phone;
          } else {
            delete updatedPayload.phone;
          }
        }

        if (user.productionBasinId !== undefined) {
          if (user.productionBasinId && user.productionBasinId.trim() !== "") {
            updatedPayload.productionBasinId = user.productionBasinId;
          } else {
            delete updatedPayload.productionBasinId;
          }
        }

        if (user.position !== undefined) {
          if (user.position && user.position.trim() !== "") {
            updatedPayload.position = user.position;
          } else {
            delete updatedPayload.position;
          }
        }

        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });
        this.syncService.triggerSync();
        return;
      }
    }

    // En mode ONLINE, ou si aucune opération existante en OFFLINE, on crée une nouvelle opération
    const updateUserRequest: Partial<UpdateUserRequest> = {};

    // Ajouter seulement les champs fournis
    if (user.familyName !== undefined) {
      updateUserRequest.familyName = user.familyName;
    }
    if (user.givenName !== undefined) {
      updateUserRequest.givenName = user.givenName;
    }
    if (user.email !== undefined) {
      updateUserRequest.email = user.email;
    }
    if (user.role !== undefined) {
      updateUserRequest.role = user.role;
    }
    if (user.lang !== undefined) {
      updateUserRequest.lang = user.lang;
    }

    // Gestion des champs optionnels
    if (user.phone !== undefined) {
      if (user.phone && user.phone.trim() !== "") {
        updateUserRequest.phone = user.phone;
      }
      // Si phone est vide ou undefined, on ne l'inclut pas dans la requête
    }

    if (user.productionBasinId !== undefined) {
      if (user.productionBasinId && user.productionBasinId.trim() !== "") {
        updateUserRequest.productionBasinId = user.productionBasinId;
      }
      // Si productionBasinId est vide ou undefined, on ne l'inclut pas dans la requête
    }

    if (user.position !== undefined) {
      if (user.position && user.position.trim() !== "") {
        updateUserRequest.position = user.position;
      } else {
        delete updateUserRequest.position;
      }
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: id,
      entityType: this.entityType,
      operation: "update",
      payload: updateUserRequest as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Met à jour le profil de l'utilisateur connecté
   */
  async updateSelf(data: UpdateSelfRequest): Promise<UserResponse> {
    try {
      const response = await apiClient.patch<UserResponse>("/me", data);

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de la mise à jour du profil.");
      }

      return response.data;
    } catch (error) {
      console.error("Error updating self:", error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(
    id: string,
    status: "active" | "inactive" | "blocked",
    reason?: string
  ): Promise<UserResponse> {
    try {
      const response = await apiClient.patch<UserResponse>(
        `/users/${id}/status`,
        { status, reason }
      );

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de la mise à jour du statut.");
      }

      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  async resetUserPassword(id: string): Promise<UserResponse> {
    try {
      const response = await apiClient.post<UserResponse>(
        `/users/${id}/admin-reset-password`
      );

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de la réinitialisation du mot de passe.");
      }

      return response.data;
    } catch (error) {
      console.error("Error resetting user password:", error);
      throw error;
    }
  }

  /**
   * Gère les opérations de synchronisation pour les utilisateurs
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
   * Gère la création d'un utilisateur côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as CreateUserRequest;

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un utilisateur"
        );
      }

      // Validation des données
      if (!payload.familyName || !payload.givenName || !payload.email) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Le nom, prénom et email sont requis"
        );
      }

      // Vérifier que les rôles nécessitant un bassin en ont un
      if (
        (payload.role === "basin_admin" || payload.role === "field_agent") &&
        !payload.productionBasinId
      ) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Un bassin de production est requis pour ce rôle"
        );
      }

      // Nettoyer le payload avant l'envoi pour éviter les valeurs undefined
      const cleanPayload = { ...payload };

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.phone || cleanPayload.phone.trim() === "") {
        delete cleanPayload.phone;
      }

      if (
        !cleanPayload.productionBasinId ||
        cleanPayload.productionBasinId.trim() === ""
      ) {
        delete cleanPayload.productionBasinId;
      }

      await apiClient.post<UserResponse>("/users", cleanPayload);
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'un utilisateur côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as UpdateUserRequest;

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier un utilisateur"
        );
      }

      // Validation des données de base
      if (
        !payload.familyName &&
        !payload.givenName &&
        !payload.email &&
        !payload.phone &&
        !payload.role &&
        !payload.productionBasinId &&
        !payload.lang
      ) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          "Aucune donnée à mettre à jour"
        );
      }

      // Nettoyer le payload avant l'envoi pour éviter les valeurs undefined
      const cleanPayload = { ...payload };

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.phone || cleanPayload.phone.trim() === "") {
        delete cleanPayload.phone;
      }

      if (
        !cleanPayload.productionBasinId ||
        cleanPayload.productionBasinId.trim() === ""
      ) {
        delete cleanPayload.productionBasinId;
      }

      // Effectuer la mise à jour
      await apiClient.put<UserResponse>(
        `/users/${operation.entityId}`,
        cleanPayload
      );
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Récupère les statistiques des utilisateurs
   */
  async getStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get<UserStats>("/users/stats");

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des statistiques utilisateurs."
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans getStats:", error);
      throw new Error(
        "Impossible de récupérer les statistiques des utilisateurs depuis le serveur."
      );
    }
  }
}
