import { SystemErrorCodes } from "@/core/domain/error-codes";
import type { ISyncHandler } from "@/core/domain/sync.types";
import { SyncStatus } from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import { db, type PendingOperation } from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import { idResolutionService } from "@/core/infrastructure/services/idResolutionService";
import type { IDocumentRepository } from "@/features/document/domain/IDocumentRepository";
import i18n from "@/i18n/client";
import { showInfo } from "@/lib/notifications/toast";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type { ITransactionRepository } from "../../domain/ITransactionRepository";
import type {
  GetTransactionsResult,
  TransactionFilters,
  TransactionStatus,
  TransactionWithSync,
} from "../../domain/Transaction";
import type { CreateTransactionRequest } from "../../domain/types/request";
import type {
  PaginatedTransactionsResponse,
  TransactionResponse,
} from "../../domain/types/response";

@injectable()
export class TransactionRepository
  implements ITransactionRepository, ISyncHandler
{
  public readonly entityType = "transaction";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.IDocumentRepository)
    private documentRepository: IDocumentRepository
  ) {}

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
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return await authService.getCurrentUserId();
  }

  private mapResponseToTransaction(
    response: TransactionResponse
  ): TransactionWithSync {
    return {
      id: response.id,
      code: response.code,
      transactionType: response.transactionType,
      locationType: response.locationType,
      status: response.status,
      transactionDate: response.transactionDate,
      notes: response.notes,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,

      // IDs
      sellerId: response.sellerId,
      buyerId: response.buyerId,
      principalExporterId: response.principalExporterId,
      createdByActorId: response.createdByActorId,
      campaignId: response.campaignId,
      calendarId: response.calendarId,
      conventionId: response.conventionId,

      // Relations
      products: response.products,
      seller: response.seller,
      buyer: response.buyer,
      principalExporter: response.principalExporter,
      createdByActor: response.createdByActor,
      campaign: response.campaign,
      calendar: response.calendar,
      convention: response.convention,

      // Attributs calculés
      isPendingComplementary: response.isPendingComplementary,
      isMyTransaction: response.isMyTransaction,
      isEditable: response.isEditable,

      syncStatus: SyncStatus.SYNCED,
    };
  }

  async getAll(
    filters: TransactionFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<GetTransactionsResult> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.perPage) params.append("perPage", filters.perPage.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.transactionType)
      params.append("transactionType", filters.transactionType);
    if (filters.locationType)
      params.append("locationType", filters.locationType);
    if (filters.status) params.append("status", filters.status);
    if (filters.sellerId) params.append("sellerId", filters.sellerId);
    if (filters.buyerId) params.append("buyerId", filters.buyerId);
    if (filters.campaignId) params.append("campaignId", filters.campaignId);
    if (filters.calendarId) params.append("calendarId", filters.calendarId);
    if (filters.conventionId)
      params.append("conventionId", filters.conventionId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await apiClient.get<PaginatedTransactionsResponse>(
      `/transactions?${params.toString()}`
    );

    if (!response.success) {
      throw new Error(response.message);
    }

    const payload = response.data;

    const transactions = payload.data.map((transaction: TransactionResponse) =>
      this.mapResponseToTransaction(transaction)
    );

    return {
      transactions,
      meta: payload.meta,
    };
  }

  /**
   * Récupère une transaction par son ID
   */
  async getById(id: string, isOnline: boolean): Promise<TransactionWithSync> {
    if (!isOnline) {
      // Mode offline : récupération depuis les opérations en attente
      const userId = await this.getCurrentUserId();

      if (!userId) {
        throw new Error(
          i18n.t("transaction:errors.userNotConnected") ||
            "Utilisateur non connecté"
        );
      }

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(id)
          .and((op) => op.userId === userId)
          .first();

        if (pendingOperation) {
          const payload =
            pendingOperation.payload as Partial<TransactionResponse>;

          return {
            id: pendingOperation.entityId,
            code: payload.code ?? "",
            transactionType: payload.transactionType ?? "SALE",
            locationType: payload.locationType ?? "MARKET",
            status: payload.status ?? "pending",
            transactionDate:
              payload.transactionDate ?? new Date().toISOString(),
            notes: payload.notes ?? null,
            createdAt: payload.createdAt ?? new Date().toISOString(),
            updatedAt: payload.updatedAt ?? new Date().toISOString(),

            // IDs
            sellerId: payload.sellerId ?? "",
            buyerId: payload.buyerId ?? "",
            principalExporterId: payload.principalExporterId ?? null,
            createdByActorId: payload.createdByActorId ?? null,
            campaignId: payload.campaignId ?? "",
            calendarId: payload.calendarId ?? null,
            conventionId: payload.conventionId ?? null,

            // Relations (vides en mode offline)
            products: payload.products ?? [],
            seller: payload.seller ?? {
              id: payload.sellerId ?? "",
              onccId: "",
              familyName: "",
              givenName: "",
            },
            buyer: payload.buyer ?? {
              id: payload.buyerId ?? "",
              onccId: "",
              familyName: "",
              givenName: "",
            },
            principalExporter: payload.principalExporter ?? undefined,
            createdByActor: payload.createdByActor ?? undefined,
            campaign: payload.campaign ?? undefined,
            calendar: payload.calendar ?? undefined,
            convention: payload.convention ?? undefined,

            // Attributs calculés
            isPendingComplementary: payload.isPendingComplementary ?? false,
            isMyTransaction: payload.isMyTransaction ?? true,
            isEditable: payload.isEditable ?? true,

            syncStatus:
              pendingOperation.operation === "create"
                ? SyncStatus.PENDING_CREATION
                : SyncStatus.PENDING_UPDATE,
          };
        } else {
          throw new Error(
            i18n.t("transaction:errors.notFoundOffline") ||
              "Transaction non trouvée en mode hors ligne"
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération offline de la transaction:",
          error
        );
        throw new Error(
          i18n.t("transaction:errors.offlineRetrievalFailed") ||
            "Impossible de récupérer la transaction en mode hors ligne"
        );
      }
    }

    // Mode online : récupération depuis l'API
    try {
      const response = await apiClient.get<TransactionResponse>(
        `/transactions/${id}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Transaction non trouvée");
      }

      return this.mapResponseToTransaction(response.data);
    } catch (error) {
      console.error("Error fetching transaction by id:", error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle transaction (stockage local + file d'attente de sync)
   */
  async add(
    transaction: Omit<TransactionWithSync, "id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        i18n.t("transaction:errors.userNotConnected") ||
          "Utilisateur non connecté - impossible de créer une transaction sans userId"
      );
    }

    // Créer les données de requête pour l'API
    // Note: campaignId n'est pas envoyé car il est déduit côté backend
    const createTransactionRequest: CreateTransactionRequest = {
      transactionType: transaction.transactionType,
      locationType: transaction.locationType,
      sellerId: transaction.sellerId,
      buyerId: transaction.buyerId,
      principalExporterId: transaction.principalExporterId || null,
      calendarId: transaction.calendarId || null,
      conventionId: transaction.conventionId || null,
      transactionDate: transaction.transactionDate,
      notes: transaction.notes || null,
      products: transaction.products.map((product) => ({
        quality: product.quality,
        standard: product.standard,
        weight: product.weight,
        bagCount: product.bagCount,
        pricePerKg: product.pricePerKg,
        totalPrice: product.totalPrice,
        producerId: product.producerId || null,
        humidity: product.humidity || null,
        notes: product.notes || null,
      })),
    };

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      transaction as unknown as {
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
      createTransactionRequest.documents = documentsWithBase64;
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createTransactionRequest, localId },
    };

    // ✅ Ajouter uniquement à la file d'attente de synchronisation (pendingOperations)
    // NOTE: On ne stocke PLUS dans db.transactions - uniquement pendingOperations
    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Met à jour une transaction existante
   */
  async update(
    id: string,
    transaction: Partial<TransactionWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        i18n.t("transaction:errors.userNotConnected") ||
          "Utilisateur non connecté - impossible de mettre à jour une transaction sans userId"
      );
    }

    showInfo(i18n.t("common:messages.processing" as never));

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
        if (transaction.transactionType !== undefined) {
          updatedPayload.transactionType = transaction.transactionType;
        }
        if (transaction.locationType !== undefined) {
          updatedPayload.locationType = transaction.locationType;
        }
        if (transaction.sellerId !== undefined) {
          updatedPayload.sellerId = transaction.sellerId;
        }
        if (transaction.buyerId !== undefined) {
          updatedPayload.buyerId = transaction.buyerId;
        }
        if (transaction.principalExporterId !== undefined) {
          updatedPayload.principalExporterId = transaction.principalExporterId;
        }
        if (transaction.campaignId !== undefined) {
          updatedPayload.campaignId = transaction.campaignId;
        }
        if (transaction.calendarId !== undefined) {
          updatedPayload.calendarId = transaction.calendarId;
        }
        if (transaction.conventionId !== undefined) {
          updatedPayload.conventionId = transaction.conventionId;
        }
        if (transaction.transactionDate !== undefined) {
          updatedPayload.transactionDate = transaction.transactionDate;
        }
        if (transaction.notes !== undefined) {
          updatedPayload.notes = transaction.notes;
        }
        if (transaction.products !== undefined) {
          updatedPayload.products = transaction.products.map((product) => ({
            quality: product.quality,
            standard: product.standard,
            weight: product.weight,
            bagCount: product.bagCount,
            pricePerKg: product.pricePerKg,
            totalPrice: product.totalPrice,
            producerId: product.producerId || null,
            humidity: product.humidity || null,
            notes: product.notes || null,
          }));
        }

        // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
        const documentsWithBase64 = (
          transaction as unknown as {
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

        // ✅ Mettre à jour uniquement l'opération pendante
        // NOTE: On ne met PLUS à jour db.transactions - uniquement pendingOperations
        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        return;
      } else {
        throw new Error(
          i18n.t("transaction:errors.pendingOperationNotFound") ||
            "Opération pendante non trouvée pour cette transaction"
        );
      }
    }

    // Mode normal : créer une nouvelle opération de mise à jour
    const updateRequest: Record<string, unknown> = {};

    if (transaction.transactionType !== undefined) {
      updateRequest.transactionType = transaction.transactionType;
    }
    if (transaction.locationType !== undefined) {
      updateRequest.locationType = transaction.locationType;
    }
    if (transaction.sellerId !== undefined) {
      updateRequest.sellerId = transaction.sellerId;
    }
    if (transaction.buyerId !== undefined) {
      updateRequest.buyerId = transaction.buyerId;
    }
    if (transaction.principalExporterId !== undefined) {
      updateRequest.principalExporterId = transaction.principalExporterId;
    }
    if (transaction.campaignId !== undefined) {
      updateRequest.campaignId = transaction.campaignId;
    }
    if (transaction.calendarId !== undefined) {
      updateRequest.calendarId = transaction.calendarId;
    }
    if (transaction.conventionId !== undefined) {
      updateRequest.conventionId = transaction.conventionId;
    }
    if (transaction.transactionDate !== undefined) {
      updateRequest.transactionDate = transaction.transactionDate;
    }
    if (transaction.notes !== undefined) {
      updateRequest.notes = transaction.notes;
    }
    if (transaction.products !== undefined) {
      updateRequest.products = transaction.products.map((product) => ({
        quality: product.quality,
        standard: product.standard,
        weight: product.weight,
        bagCount: product.bagCount,
        pricePerKg: product.pricePerKg,
        totalPrice: product.totalPrice,
        producerId: product.producerId || null,
        humidity: product.humidity || null,
        notes: product.notes || null,
      }));
    }

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      transaction as unknown as {
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
   * Traite une opération de synchronisation pour une transaction
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
          `Opération non supportée pour transaction: ${operation.operation}`
        );
    }
  }

  /**
   * Gère la création d'une transaction côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { documents, localId, ...payload } =
      operation.payload as unknown as CreateTransactionRequest & {
        localId?: string;
      };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer une transaction"
        );
      }

      // ✅ 1. RÉSOUDRE TOUS LES IDs VERS serverIds (obligatoires)
      const resolvedSellerId = await idResolutionService.resolveActorId(
        payload.sellerId
      );
      const resolvedBuyerId = await idResolutionService.resolveActorId(
        payload.buyerId
      );

      // ✅ Résoudre les IDs optionnels
      let resolvedPrincipalExporterId: string | null = null;
      if (payload.principalExporterId) {
        resolvedPrincipalExporterId = await idResolutionService.resolveActorId(
          payload.principalExporterId
        );
      }

      let resolvedCalendarId: string | null = null;
      if (payload.calendarId) {
        const resolved = await idResolutionService.resolveCalendarId(
          payload.calendarId
        );
        resolvedCalendarId = resolved || null;
      }

      let resolvedConventionId: string | null = null;
      if (payload.conventionId) {
        const resolved = await idResolutionService.resolveConventionId(
          payload.conventionId
        );
        resolvedConventionId = resolved || null;
      }

      // ✅ Résoudre producerId dans les produits s'il existe
      const resolvedProducts = await Promise.all(
        (payload.products || []).map(async (product) => {
          if (product.producerId) {
            const resolvedProducerId = await idResolutionService.resolveActorId(
              product.producerId
            );
            return { ...product, producerId: resolvedProducerId };
          }
          return product;
        })
      );

      // ✅ 2. Construire le payload avec UNIQUEMENT des serverIds
      const cleanPayload = {
        ...payload,
        sellerId: resolvedSellerId,
        buyerId: resolvedBuyerId,
        principalExporterId: resolvedPrincipalExporterId,
        calendarId: resolvedCalendarId,
        conventionId: resolvedConventionId,
        products: resolvedProducts,
      };

      // Supprimer les attributs non nécessaires pour l'API
      delete (cleanPayload as Record<string, unknown>).id;
      delete (cleanPayload as Record<string, unknown>).localId;
      delete (cleanPayload as Record<string, unknown>).documents;

      // 3. Créer la transaction
      const transactionResponse = await apiClient.post<TransactionResponse>(
        "/transactions",
        cleanPayload
      );

      if (!transactionResponse.success || !transactionResponse.data) {
        throw new Error("Échec de la création de la transaction");
      }

      const transactionId = transactionResponse.data.id;

      // 4. Supprimer de db.transactions après sync réussie
      if (localId) {
        await db.transactions.where("localId").equals(localId).delete();
      }

      // 5. Uploader les documents si présents dans le payload
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
              documentableType: "Transaction",
              documentableId: transactionId,
              documentTypes,
            },
            true // isOnline
          );
        } catch {
          // On ne bloque pas la création de la transaction si les documents échouent
        }
      }

      // ⚠️ PAS de gestion idMapping pour les transactions (entité finale)
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'une transaction côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as Record<string, unknown>;

    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour mettre à jour une transaction"
        );
      }

      const url = `/transactions/${operation.entityId}`;

      // N'envoyer que les champs fournis dans le payload (sans documents)
      const updateBody: Record<string, unknown> = {};
      if (payload.transactionType !== undefined)
        updateBody.transactionType = payload.transactionType;
      if (payload.locationType !== undefined)
        updateBody.locationType = payload.locationType;
      if (payload.sellerId !== undefined)
        updateBody.sellerId = payload.sellerId;
      if (payload.buyerId !== undefined) updateBody.buyerId = payload.buyerId;
      if (payload.principalExporterId !== undefined)
        updateBody.principalExporterId = payload.principalExporterId;
      if (payload.campaignId !== undefined)
        updateBody.campaignId = payload.campaignId;
      if (payload.calendarId !== undefined)
        updateBody.calendarId = payload.calendarId;
      if (payload.conventionId !== undefined)
        updateBody.conventionId = payload.conventionId;
      if (payload.transactionDate !== undefined)
        updateBody.transactionDate = payload.transactionDate;
      if (payload.notes !== undefined) updateBody.notes = payload.notes;
      if (payload.products !== undefined)
        updateBody.products = payload.products;

      await apiClient.put(url, updateBody);
    } catch (err) {
      // Relancer l'erreur pour gestion par SyncService (retry/backoff)
      throw err;
    }
  }

  /**
   * Met à jour le statut d'une transaction (confirm ou cancel)
   * Cette opération nécessite une connexion internet
   */
  async updateStatus(id: string, status: TransactionStatus): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          i18n.t("transaction:errors.userNotConnected") ||
            "Token d'authentification requis"
        );
      }

      // Utiliser les endpoints spécifiques pour confirm et cancel
      if (status === "confirmed") {
        const url = `/transactions/${id}/confirm`;
        await apiClient.post(url, {});
      } else if (status === "cancelled") {
        const url = `/transactions/${id}/cancel`;
        await apiClient.post(url, { reason: "Annulé par l'utilisateur" });
      } else {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          `Invalid status: ${status}`
        );
      }
    } catch (err) {
      console.error("Error updating transaction status:", err);
      throw err;
    }
  }

  /**
   * Met à jour les produits d'une transaction
   * Cette opération nécessite une connexion internet
   */
  async updateProducts(
    id: string,
    products: Array<{
      id: string;
      quality: string;
      standard: string;
      weight: number;
      bagCount: number;
      pricePerKg: number;
      totalPrice: number;
      humidity: number | null;
      producerId: string | null;
      notes: string | null;
    }>
  ): Promise<TransactionWithSync> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          i18n.t("transaction:errors.userNotConnected") ||
            "Token d'authentification requis"
        );
      }

      const url = `/transactions/${id}/products`;

      // Mapper les produits pour l'API (enlever l'id temporaire du form)
      const productsPayload = products.map((product) => ({
        quality: product.quality,
        standard: product.standard,
        weight: product.weight,
        bagCount: product.bagCount,
        pricePerKg: product.pricePerKg,
        totalPrice: product.totalPrice,
        humidity: product.humidity || null,
        producerId: product.producerId || null,
        notes: product.notes || null,
      }));

      const response = await apiClient.put<TransactionResponse>(url, {
        products: productsPayload,
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Échec de la mise à jour des produits"
        );
      }

      return this.mapResponseToTransaction(response.data);
    } catch (err) {
      console.error("Error updating transaction products:", err);
      throw err;
    }
  }
}
