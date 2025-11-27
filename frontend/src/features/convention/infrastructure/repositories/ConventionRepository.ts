import { ACTOR_TYPES } from "@/core/domain";
import { SystemErrorCodes } from "@/core/domain/error-codes";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import type { ISyncHandler } from "@/core/domain/sync.types";
import { SyncStatus } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import { db, type PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import { idResolutionService } from "@/core/infrastructure/services/idResolutionService";
import type { PollingService } from "@/core/infrastructure/services/pollingService";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import type { IDocumentRepository } from "@/features/document/domain/IDocumentRepository";
import i18n from "@/i18n/client";
import { showInfo } from "@/lib/notifications/toast";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type { IConventionRepository } from "../../domain/IConventionRepository";
import type {
  ConventionFilters,
  ConventionResponse,
  ConventionWithSync,
  CreateConventionRequest,
  GetConventionsResult,
  PaginatedConventionsResponse,
  ProductQuality,
  ProductStandard,
} from "../../domain/types";

@injectable()
export class ConventionRepository
  implements IConventionRepository, ISyncHandler
{
  public readonly entityType = "convention";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.IDocumentRepository)
    private documentRepository: IDocumentRepository,
    @inject(DI_TOKENS.PollingService) private pollingService: PollingService
  ) {
    // ⭐ Enregistrer le callback de changement d'utilisateur
    this.pollingService.onUserChange(async (oldUserId, newUserId) => {
      console.log(
        `🗑️ ConventionRepository: Nettoyage des données suite au changement d'utilisateur (${oldUserId} → ${newUserId})`
      );
      await this.clearAllLocalData();
      console.log(`✅ ConventionRepository: Données nettoyées avec succès`);
    });
  }

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return await authService.getCurrentUserId();
  }

  /**
   * Génère un code de convention local unique (CONV-LOCAL-xxxx)
   * Utilise un compteur persistant dans settings qui ne se réinitialise jamais
   */
  private async generateLocalConventionCode(): Promise<string> {
    const COUNTER_KEY = "convention_local_counter";

    // Récupérer le compteur actuel depuis settings
    const counterSetting = await db.settings
      .where("key")
      .equals(COUNTER_KEY)
      .first();

    let currentCounter = 0;
    if (counterSetting) {
      currentCounter = parseInt(counterSetting.value, 10);
    }

    // Incrémenter
    const nextNumber = currentCounter + 1;
    const paddedNumber = nextNumber.toString().padStart(4, "0");

    // Sauvegarder le nouveau compteur
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

    return `CONV-LOCAL-${paddedNumber}`;
  }

  /**
   * Convertit base64 en File
   */
  private base64ToFile(
    base64Data: string,
    mimeType: string,
    fileName: string
  ): File {
    // Extraire les données base64 (enlever le préfixe data:image/...;base64,)
    const base64String = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    // Convertir base64 en bytes
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Créer un Blob puis un File
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters?: ConventionFilters): URLSearchParams {
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
      if (filters.buyerExporterId !== undefined) {
        params.append("buyerExporterId", filters.buyerExporterId);
      }
      if (filters.producersId !== undefined) {
        params.append("producersId", filters.producersId);
      }
      if (filters.campaignId !== undefined) {
        params.append("campaignId", filters.campaignId);
      }
    }

    return params;
  }

  /**
   * Mappe une réponse API vers une convention avec metadata de synchronisation
   */
  private mapResponseToConvention(
    response: ConventionResponse
  ): ConventionWithSync {
    return {
      id: response.id,
      code: response.code,
      buyerExporterId: response.buyerExporterId,
      producersId: response.producersId,
      signatureDate: response.signatureDate,
      products: response.products.map((p) => ({
        quality: p.quality as ProductQuality,
        standard: p.standard as ProductStandard,
        weight: p.weight,
        bags: p.bags,
        humidity: p.humidity,
        pricePerKg: p.pricePerKg,
      })),
      status: response.status, // Mapper le statut
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
      // Mapper les relations si présentes (partial car API renvoie sous-ensemble)
      buyerExporter: response.buyerExporter
        ? {
            id: response.buyerExporter.id,
            actorType: response.buyerExporter.actorType as
              | "PRODUCER"
              | "TRANSFORMER"
              | "PRODUCERS"
              | "BUYER"
              | "EXPORTER",
            familyName: response.buyerExporter.familyName,
            givenName: response.buyerExporter.givenName,
            onccId: response.buyerExporter.onccId,
          }
        : undefined,
      producers: response.producers
        ? {
            id: response.producers.id,
            actorType: response.producers.actorType as
              | "PRODUCER"
              | "TRANSFORMER"
              | "PRODUCERS"
              | "BUYER"
              | "EXPORTER",
            familyName: response.producers.familyName,
            givenName: response.producers.givenName,
            onccId: response.producers.onccId,
          }
        : undefined,
      campaigns: response.campaigns
        ? response.campaigns.map((c) => ({
            id: c.id,
            year: 0, // Le backend renvoie code au lieu de year
            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status as "active" | "inactive",
          }))
        : undefined,
    };
  }

  /**
   * Récupère les conventions.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Non supporté pour getAll (retourne uniquement les données en ligne).
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec les conventions et les métadonnées de pagination
   */
  async getAll(
    filters: ConventionFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOnline: boolean
  ): Promise<GetConventionsResult> {
    // EN LIGNE: Récupérer les données du serveur
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = queryParams.toString()
        ? `/conventions?${queryParams.toString()}`
        : "/conventions";

      const response = await apiClient.get<PaginatedConventionsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la récupération des conventions."
        );
      }

      const serverData = response.data;

      const conventions = serverData.data.map((conventionResponse) =>
        this.mapResponseToConvention(conventionResponse)
      );

      return {
        conventions: conventions,
        meta: serverData.meta,
      };
    } catch {
      throw new Error(
        "Impossible de récupérer les conventions depuis le serveur."
      );
    }
  }

  /**
   * Ajoute une nouvelle convention (stockage local + file d'attente de sync)
   */
  async add(
    convention: Omit<ConventionWithSync, "id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const timestamp = Date.now();
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une convention sans userId"
      );
    }

    // Créer les données de requête pour l'API
    const createConventionRequest: CreateConventionRequest = {
      buyerExporterId: convention.buyerExporterId,
      producersId: convention.producersId,
      signatureDate: convention.signatureDate,
      products: convention.products,
    };

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      convention as unknown as {
        documents?: Array<{
          base64Data: string;
          mimeType: string;
          fileName: string;
          documentType: string;
        }>;
      }
    ).documents;

    // Ajouter les documents au payload si présents
    if (documentsWithBase64 && documentsWithBase64.length > 0) {
      createConventionRequest.documents = documentsWithBase64;
    }

    // 1. Ajouter dans pendingOperations avec localId
    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createConventionRequest, localId }, // ← Ajouter localId
    };

    await this.syncService.queueOperation(operation, userId);

    // 3. Générer le code local et ajouter dans db.conventions (cache pour formulaires)
    const localCode = await this.generateLocalConventionCode();

    // Récupérer les acteurs pour déterminer serverId vs localId
    const producer = await db.actors
      .where("serverId")
      .equals(convention.producersId)
      .or("localId")
      .equals(convention.producersId)
      .first();

    const buyerExporter = await db.actors
      .where("serverId")
      .equals(convention.buyerExporterId)
      .or("localId")
      .equals(convention.buyerExporterId)
      .first();

    await db.conventions.add({
      localId, // ← Clé offline
      code: localCode, // CONV-LOCAL-0001, CONV-LOCAL-0002, etc.
      producerServerId: producer?.serverId,
      producerLocalId: producer?.localId,
      buyerExporterServerId: buyerExporter?.serverId,
      buyerExporterLocalId: buyerExporter?.localId,
      signatureDate: convention.signatureDate,
      status: "active",
      products: convention.products,
      syncedAt: timestamp,
    });
  }

  /**
   * Met à jour une convention existante
   */
  async update(
    id: string,
    convention: Partial<ConventionWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour une convention sans userId"
      );
    }

    showInfo(i18n.t("convention:messages.processing"));

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
        if (convention.buyerExporterId !== undefined) {
          updatedPayload.buyerExporterId = convention.buyerExporterId;
        }
        if (convention.producersId !== undefined) {
          updatedPayload.producersId = convention.producersId;
        }
        if (convention.signatureDate !== undefined) {
          updatedPayload.signatureDate = convention.signatureDate;
        }
        if (convention.products !== undefined) {
          updatedPayload.products = convention.products;
        }

        // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
        const documentsWithBase64 = (
          convention as unknown as {
            documents?: Array<{
              base64Data: string;
              mimeType: string;
              fileName: string;
              documentType: string;
            }>;
          }
        ).documents;

        if (documentsWithBase64 && documentsWithBase64.length > 0) {
          updatedPayload.documents = documentsWithBase64;
        }

        // Mettre à jour l'opération pendante
        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        // ✅ MISE À JOUR de db.conventions pour la convention avec localId
        // Vérifier si c'est une convention locale (avec localId)
        const conventionInDb = await db.conventions
          .filter((c) => c.localId === id)
          .first();

        if (conventionInDb) {
          // Préparer les champs à mettre à jour
          const updateFields: Partial<typeof conventionInDb> = {};

          if (convention.producersId !== undefined) {
            // Récupérer les acteurs pour déterminer serverId vs localId
            const producer = await db.actors
              .where("serverId")
              .equals(convention.producersId)
              .or("localId")
              .equals(convention.producersId)
              .first();
            updateFields.producerServerId = producer?.serverId;
            updateFields.producerLocalId = producer?.localId;
          }
          if (convention.buyerExporterId !== undefined) {
            const buyerExporter = await db.actors
              .where("serverId")
              .equals(convention.buyerExporterId)
              .or("localId")
              .equals(convention.buyerExporterId)
              .first();

            updateFields.buyerExporterServerId = buyerExporter?.serverId;
            updateFields.buyerExporterLocalId = buyerExporter?.localId;
          }
          if (convention.signatureDate !== undefined) {
            updateFields.signatureDate = convention.signatureDate;
          }
          if (convention.products !== undefined) {
            updateFields.products = convention.products;
          }

          await db.conventions
            .where("localId")
            .equals(conventionInDb.localId!)
            .modify(updateFields);
        }

        return;
      } else {
        throw new Error("Opération pendante non trouvée pour cette convention");
      }
    }

    // Mode normal : créer une nouvelle opération de mise à jour
    const updateRequest: Record<string, unknown> = {};

    if (convention.buyerExporterId !== undefined) {
      updateRequest.buyerExporterId = convention.buyerExporterId;
    }
    if (convention.producersId !== undefined) {
      updateRequest.producersId = convention.producersId;
    }
    if (convention.signatureDate !== undefined) {
      updateRequest.signatureDate = convention.signatureDate;
    }
    if (convention.products !== undefined) {
      updateRequest.products = convention.products;
    }

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      convention as unknown as {
        documents?: Array<{
          base64Data: string;
          mimeType: string;
          fileName: string;
          documentType: string;
        }>;
      }
    ).documents;

    if (documentsWithBase64 && documentsWithBase64.length > 0) {
      updateRequest.documents = documentsWithBase64;
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
   * Récupère une convention par son ID
   */
  async getById(id: string, isOnline: boolean): Promise<ConventionWithSync> {
    // Mode online : récupération depuis l'API
    if (isOnline) {
      try {
        const response = await apiClient.get<ConventionResponse>(
          `/conventions/${id}`
        );

        if (!response.success || !response.data) {
          throw new Error(
            "Erreur serveur lors de la récupération de la convention."
          );
        }

        // La réponse du backend suit le format ApiResponse standard
        // Les données sont directement dans data
        const conventionData = response.data;

        return this.mapResponseToConvention(conventionData);
      } catch {
        throw new Error(
          "Impossible de récupérer la convention depuis le serveur."
        );
      }
    }

    // Mode offline : pas de récupération possible pour les conventions existantes
    // Les conventions ne sont accessibles offline que si elles ont été créées/modifiées localement
    throw new Error(
      "La consultation des conventions nécessite une connexion internet"
    );
  }

  /**
   * Traite une opération de synchronisation pour une convention
   * Implémentation de ISyncHandler.handle()
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
          `Opération non supportée pour convention: ${operation.operation}`
        );
    }
  }

  /**
   * Gère la création d'une convention côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { documents, localId, ...payload } =
      operation.payload as unknown as CreateConventionRequest & {
        localId?: string;
      };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer une convention"
        );
      }

      // Résoudre les IDs des acteurs (peuvent être localIds ou serverIds)
      const resolvedOpaId = await idResolutionService.resolveActorId(
        payload.producersId
      );
      const resolvedBuyerExporterId = await idResolutionService.resolveActorId(
        payload.buyerExporterId
      );

      // Nettoyer le payload avant l'envoi
      const cleanPayload = {
        ...payload,
        producersId: resolvedOpaId,
        buyerExporterId: resolvedBuyerExporterId,
      };

      // Supprimer l'ID local qui n'est pas nécessaire pour l'API
      delete (cleanPayload as Record<string, unknown>).id;
      delete (cleanPayload as Record<string, unknown>).localId;

      // ✅ Supprimer le code local - le backend générera son propre code avec la bonne année
      delete (cleanPayload as Record<string, unknown>).code;

      // Supprimer les documents qui seront uploadés séparément
      delete (cleanPayload as Record<string, unknown>).documents;

      // 1. Créer la convention
      const conventionResponse = await apiClient.post<ConventionResponse>(
        "/conventions",
        cleanPayload
      );

      if (!conventionResponse.success || !conventionResponse.data) {
        throw new Error("Échec de la création de la convention");
      }

      // La réponse du backend suit le format ApiResponse standard
      // conventionResponse.data contient directement la convention
      const conventionData = conventionResponse.data;
      const serverId = conventionData.id;

      // 2. Si localId présent, mettre à jour le mapping, les acteurs ET db.conventions
      if (localId) {
        // 2c. Mettre à jour db.conventions: remplacer localId par id serveur + code serveur
        const existingConvention = await db.conventions
          .where("localId")
          .equals(localId)
          .first();

        if (existingConvention) {
          // Mettre à jour la convention existante (conserve son id auto-généré)
          await db.conventions.update(existingConvention.id!, {
            serverId: serverId, // Ajouter l'UUID serveur
            localId: undefined, // Conserver le localId pour traçabilité
            code: conventionData.code,
            producerServerId: conventionData.producersId, // Après sync, c'est un serverId
            producerLocalId: undefined,
            buyerExporterServerId: conventionData.buyerExporterId, // Après sync, c'est un serverId
            buyerExporterLocalId: undefined,
            signatureDate: conventionData.signatureDate,
            status: conventionData.status,
            products: conventionData.products.map((p) => ({
              quality: p.quality as ProductQuality,
              standard: p.standard as ProductStandard,
              weight: p.weight,
              bags: p.bags,
              humidity: p.humidity,
              pricePerKg: p.pricePerKg,
            })),
            syncedAt: Date.now(),
          });
        }
      }

      // 3. Uploader les documents si présents dans le payload
      if (documents && documents.length > 0) {
        try {
          // Convertir tous les documents base64 en File
          const files = documents.map((doc) =>
            this.base64ToFile(doc.base64Data, doc.mimeType, doc.fileName)
          );

          // Extraire les types de documents
          const documentTypes = documents.map((doc) => doc.documentType);

          // Upload tous les documents en une seule requête via DocumentRepository
          await this.documentRepository.uploadDocuments(
            {
              files,
              documentableType: "Convention",
              documentableId: serverId,
              documentTypes,
            },
            true // isOnline
          );
        } catch {
          // On ne bloque pas la création de la convention si les documents échouent
        }
      }
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'une convention côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as Partial<{
      buyerExporterId: string;
      producersId: string;
      signatureDate: string;
      products: Array<{
        quality: string;
        standard: string;
        weight: number;
        bags: number;
        humidity: number;
        pricePerKg: number;
      }>;
    }>;

    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour mettre à jour une convention"
        );
      }

      const url = `/conventions/${operation.entityId}`;

      // Résoudre les IDs des acteurs avant l'envoi (peuvent être localIds ou serverIds)
      const updateBody: Record<string, unknown> = {};

      if (payload.buyerExporterId !== undefined) {
        const resolvedBuyerExporterId = await idResolutionService.resolveActorId(
          payload.buyerExporterId
        );
        updateBody.buyerExporterId = resolvedBuyerExporterId;
      }

      if (payload.producersId !== undefined) {
        const resolvedOpaId = await idResolutionService.resolveActorId(
          payload.producersId
        );
        updateBody.producersId = resolvedOpaId;
      }

      if (payload.signatureDate !== undefined)
        updateBody.signatureDate = payload.signatureDate;
      if (payload.products !== undefined)
        updateBody.products = payload.products;

      await apiClient.put(url, updateBody);
    } catch (err) {
      // Relancer l'erreur pour gestion par SyncService (retry/backoff)
      throw err;
    }
  }

  /**
   * Associe une convention à la campagne active
   */
  public async associateToCampaign(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void> {
    if (!isOnline) {
      throw new ApiError(
        SystemErrorCodes.SERVICE_UNAVAILABLE,
        i18n.t("common:sync.unavailableOffline")
      );
    }

    try {
      await apiClient.post(`/conventions/${conventionId}/campaigns`, {
        campaignId,
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Dissocie une convention d'une campagne
   */
  public async dissociateFromCampaign(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void> {
    if (!isOnline) {
      throw new ApiError(
        SystemErrorCodes.SERVICE_UNAVAILABLE,
        i18n.t("common:sync.unavailableOffline")
      );
    }

    try {
      await apiClient.delete(`/conventions/${conventionId}/campaigns`, {
        campaignId,
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Vérifie si l'utilisateur a un rôle autorisé pour synchroniser les conventions
   * Les conventions sont synchronisées pour basin_admin, field_agent et actor_manager
   * Exclus : technical_admin
   * @returns true si l'utilisateur a un rôle autorisé
   */
  private hasAuthorizedRole(): boolean {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    // Exclure technical_admin
    return (
      user.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
      user.role === USER_ROLES_CONSTANTS.FIELD_AGENT ||
      (user.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
        user.actor?.actorType !== ACTOR_TYPES.TRANSFORMER)
    );
  }

  /**
   * Obtient le timestamp de la dernière synchronisation depuis localStorage
   */
  private getLastSyncTime(): number {
    const storedTime = localStorage.getItem("conventions_last_sync_time");
    return storedTime ? Number.parseInt(storedTime, 10) : 0;
  }

  /**
   * Sauvegarde le timestamp de la dernière synchronisation dans localStorage
   */
  private setLastSyncTime(timestamp: number): void {
    localStorage.setItem("conventions_last_sync_time", timestamp.toString());
  }

  /**
   * Obtient le nombre de conventions en local
   */
  private async getLocalCount(): Promise<number> {
    return db.conventions.count();
  }

  /**
   * Efface les conventions locales
   * Utilisé lors d'un changement d'utilisateur
   * PUBLIC : Appelé par le callback enregistré dans PollingService
   */
  public async clearAllLocalData(): Promise<void> {
    console.log("🗑️ Effacement des conventions locales...");

    try {
      // Effacer la table conventions
      await db.conventions.clear();

      // Effacer le timestamp de synchronisation des conventions
      localStorage.removeItem("conventions_last_sync_time");

      console.log("✅ Conventions locales effacées");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'effacement des conventions locales:",
        error
      );
      throw error;
    }
  }

  /**
   * Synchronise les conventions depuis l'API
   * @param isInitialSync true pour sync initiale (tous les conventions), false pour sync incrémentale
   */
  private async syncFromApi(isInitialSync: boolean): Promise<void> {
    try {
      if (isInitialSync) {
        // ⭐ SYNC INITIALE : Récupérer toutes les conventions
        console.log("📡 Récupération de toutes les conventions...");

        const response = await apiClient.get<{
          conventions: ConventionResponse[];
          total: number;
          syncedAt: number;
        }>("/conventions/sync/all");

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide lors de la sync initiale");
        }

        const serverConventions = response.data?.conventions || [];
        console.log(
          `📥 ${serverConventions.length} convention(s) reçue(s) du serveur`
        );

        // Mapper les conventions ACTIVES pour IndexedDB (ignorer les inactives)
        const conventionsToStore = serverConventions
          .filter((serverConv) => serverConv.status === "active")
          .map((serverConv: ConventionResponse) => ({
            serverId: serverConv.id, // UUID serveur
            localId: undefined, // Pas de localId pour les conventions du serveur
            code: serverConv.code,
            producerServerId: serverConv.producersId,
            buyerExporterServerId: serverConv.buyerExporterId,
            signatureDate: serverConv.signatureDate,
            status: serverConv.status,
            products: serverConv.products.map(
              (p: {
                quality: string;
                standard: string;
                weight: number;
                bags: number;
                humidity: number;
                pricePerKg: number;
              }) => ({
                quality: p.quality as ProductQuality,
                standard: p.standard as ProductStandard,
                weight: p.weight,
                bags: p.bags,
                humidity: p.humidity,
                pricePerKg: p.pricePerKg,
              })
            ),
            syncedAt: Date.now(),
          }));

        await db.conventions.bulkAdd(conventionsToStore);
        console.log(
          `✅ Sync initiale: ${
            conventionsToStore.length
          } convention(s) active(s) stockée(s), ${
            serverConventions.length - conventionsToStore.length
          } inactive(s) ignorée(s)`
        );
      } else {
        // ⭐ SYNC INCRÉMENTALE : Récupérer uniquement les conventions modifiées
        const lastSync = this.getLastSyncTime();
        console.log(
          `📡 Récupération des conventions modifiées depuis ${new Date(
            lastSync
          ).toISOString()}...`
        );

        const response = await apiClient.get<{
          conventions: ConventionResponse[];
          total: number;
          since: number;
          syncedAt: number;
        }>(`/conventions/sync/updates?since=${lastSync}`);

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide lors de la sync incrémentale");
        }

        const serverConventions = response.data?.conventions || [];
        console.log(
          `📥 ${serverConventions.length} convention(s) modifiée(s) reçue(s) du serveur`
        );

        if (serverConventions.length > 0) {
          // Pour la sync incrémentale, on doit mettre à jour les entrées existantes
          // en les retrouvant par serverId et en conservant leur id auto-généré
          let addedCount = 0;
          let updatedCount = 0;
          let deletedCount = 0;

          for (const serverConv of serverConventions) {
            // Chercher la convention existante par serverId
            const existingConvention = await db.conventions
              .where("serverId")
              .equals(serverConv.id)
              .first();

            // Si la convention est inactive, la supprimer de la base locale
            if (serverConv.status === "inactive") {
              if (existingConvention) {
                await db.conventions.delete(existingConvention.id!);
                deletedCount++;
                console.log(
                  `🗑️ Convention ${serverConv.code} (inactive) supprimée de la base locale`
                );
              }
              continue; // Passer à la convention suivante
            }

            // Si la convention est active
            if (existingConvention) {
              // Mettre à jour l'entrée existante en conservant son id
              await db.conventions.update(existingConvention.id!, {
                serverId: serverConv.id,
                code: serverConv.code,
                producerServerId: serverConv.producersId, // Les IDs du serveur sont des serverIds
                producerLocalId: undefined,
                buyerExporterServerId: serverConv.buyerExporterId, // Les IDs du serveur sont des serverIds
                buyerExporterLocalId: undefined,
                signatureDate: serverConv.signatureDate,
                status: serverConv.status,
                products: serverConv.products.map(
                  (p: {
                    quality: string;
                    standard: string;
                    weight: number;
                    bags: number;
                    humidity: number;
                    pricePerKg: number;
                  }) => ({
                    quality: p.quality as ProductQuality,
                    standard: p.standard as ProductStandard,
                    weight: p.weight,
                    bags: p.bags,
                    humidity: p.humidity,
                    pricePerKg: p.pricePerKg,
                  })
                ),
                syncedAt: Date.now(),
              });
              updatedCount++;
            } else {
              // Nouvelle convention active, l'ajouter (id sera auto-généré)
              await db.conventions.add({
                serverId: serverConv.id,
                localId: undefined,
                code: serverConv.code,
                producerServerId: serverConv.producersId, // Les IDs du serveur sont des serverIds
                producerLocalId: undefined,
                buyerExporterServerId: serverConv.buyerExporterId, // Les IDs du serveur sont des serverIds
                buyerExporterLocalId: undefined,
                signatureDate: serverConv.signatureDate,
                status: serverConv.status,
                products: serverConv.products.map(
                  (p: {
                    quality: string;
                    standard: string;
                    weight: number;
                    bags: number;
                    humidity: number;
                    pricePerKg: number;
                  }) => ({
                    quality: p.quality as ProductQuality,
                    standard: p.standard as ProductStandard,
                    weight: p.weight,
                    bags: p.bags,
                    humidity: p.humidity,
                    pricePerKg: p.pricePerKg,
                  })
                ),
                syncedAt: Date.now(),
              });
              addedCount++;
            }
          }

          console.log(
            `✅ Sync incrémentale: ${serverConventions.length} convention(s) traitée(s) (${addedCount} ajoutée(s), ${updatedCount} mise(s) à jour, ${deletedCount} supprimée(s))`
          );
        }
      }

      // ⭐ SAUVEGARDER LE TIMESTAMP DE DERNIÈRE SYNC
      this.setLastSyncTime(Date.now());
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation des conventions:",
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
    console.log("🔑 Synchronisation des conventions déclenchée...");

    try {
      // ⭐ VÉRIFIER LE RÔLE DE L'UTILISATEUR
      if (!this.hasAuthorizedRole()) {
        console.log(
          "⚠️ Utilisateur sans rôle autorisé (technical_admin exclu) - synchronisation des conventions ignorée."
        );
        return;
      }

      // Vérifier si nous avons des données locales
      const localCount = await this.getLocalCount();

      if (localCount === 0) {
        // ⭐ SYNC INITIALE (première fois) - Toutes les conventions
        console.log(
          "🔄 Aucune donnée locale, synchronisation initiale des conventions..."
        );
        await this.syncFromApi(true); // isInitialSync = true
        console.log(
          "✅ Conventions synchronisées avec succès (sync initiale)."
        );
        return;
      }

      // ⭐ VÉRIFIER LES DELTA COUNTS (sauvegardés par PollingService)
      const deltaCount = this.pollingService.getEntityCount("conventions");

      if (deltaCount > 0) {
        // ⭐ SYNC INCRÉMENTALE - Uniquement les conventions modifiées
        console.log(
          `🔄 ${deltaCount} convention(s) modifiée(s) détectée(s), synchronisation incrémentale en cours...`
        );
        await this.syncFromApi(false); // isInitialSync = false

        // ⭐ RESET DU COUNT APRÈS SYNC RÉUSSIE
        this.pollingService.setEntityCount("conventions", 0);
        console.log(
          "✅ Conventions synchronisées avec succès après mise à jour incrémentale."
        );
      } else {
        console.log("👍 Données des conventions déjà à jour.");
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation des conventions:",
        error
      );
    }
  }
}
