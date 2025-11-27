import { apiClient, ApiError } from '@/core/infrastructure/api'
import { SystemErrorCodes } from '@/core/domain/error-codes'
import { ISyncHandler, SyncStatus } from '@/core/domain/sync.types'
import type { PendingOperation } from '@/core/infrastructure/database/db'
import { db } from '@/core/infrastructure/database/db'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { SyncService } from '@/core/infrastructure/services'
import { authService } from '@/core/infrastructure/services/auth.service'
import { idResolutionService } from '@/core/infrastructure/services/idResolutionService'
import { DocumentRepository } from '@/features/document/infrastructure/repositories/documentRepository'
import { inject, injectable } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'
import type {
  GetProductTransfersResult,
  IProductTransferRepository,
  ProductTransferWithSync,
  ProductTransferFilters,
  TransferStatus,
} from '../../domain'
import type { CreateProductTransferRequest, UpdateProductTransferRequest } from '../../domain/types/request'
import type { ProductTransferResponse, PaginatedProductTransfersResponse } from '../../domain/types/response'

@injectable()
export class ProductTransferRepository implements IProductTransferRepository, ISyncHandler {
  public readonly entityType = 'product-transfer'

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.IDocumentRepository) private documentRepository: DocumentRepository
  ) {}

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    return await authService.getCurrentUserId()
  }

  /**
   * Mappe une réponse API vers un ProductTransferWithSync
   */
  private mapResponseToProductTransfer(response: ProductTransferResponse): ProductTransferWithSync {
    return {
      id: response.id,
      code: response.code,
      transferType: response.transferType,
      senderActorId: response.senderActorId,
      senderStoreId: response.senderStoreId,
      receiverActorId: response.receiverActorId,
      receiverStoreId: response.receiverStoreId,
      campaignId: response.campaignId,
      transferDate: response.transferDate,
      driverInfo: response.driverInfo,
      products: response.products,
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      // Relations
      senderActor: response.senderActor,
      senderStore: response.senderStore,
      receiverActor: response.receiverActor,
      receiverStore: response.receiverStore,
      campaign: response.campaign,
      syncStatus: SyncStatus.SYNCED,
    }
  }

  /**
   * Récupère tous les transferts selon les filtres
   */
  async getAll(
    filters: ProductTransferFilters,
    isOnline: boolean
  ): Promise<GetProductTransfersResult> {
    if (!isOnline) {
      // TODO: Implémenter la récupération offline depuis IndexedDB
      return {
        productTransfers: [],
        meta: {
          total: 0,
          perPage: filters.per_page || 10,
          currentPage: filters.page || 1,
          lastPage: 1,
          firstPage: 1,
          firstPageUrl: '',
          lastPageUrl: '',
          nextPageUrl: null,
          previousPageUrl: null,
        },
      }
    }

    // Mode online : récupération depuis l'API
    try {
      // Construire les query params
      const queryParams = new URLSearchParams()
      if (filters.page) queryParams.append('page', filters.page.toString())
      if (filters.per_page) queryParams.append('limit', filters.per_page.toString())
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.transferType) queryParams.append('transferType', filters.transferType)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.senderActorId) queryParams.append('senderActorId', filters.senderActorId)
      if (filters.receiverActorId) queryParams.append('receiverActorId', filters.receiverActorId)
      if (filters.campaignId) queryParams.append('campaignId', filters.campaignId)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.period) queryParams.append('period', filters.period.toString())

      const queryString = queryParams.toString()
      const endpoint = queryString
        ? `/product-transfers?${queryString}`
        : '/product-transfers'

      const response = await apiClient.get<PaginatedProductTransfersResponse>(endpoint)

      if (!response.success || !response.data) {
        throw new Error('Erreur lors de la récupération des transferts de produit')
      }

      return {
        productTransfers: response.data.data.map((transfer) =>
          this.mapResponseToProductTransfer(transfer)
        ),
        meta: response.data.meta,
      }
    } catch (error) {
      console.error('Error fetching product transfers:', error)
      throw error
    }
  }

  /**
   * Récupère un transfert par son ID
   */
  async getById(id: string, isOnline: boolean): Promise<ProductTransferWithSync> {
    if (!isOnline) {
      // Mode offline : récupération depuis les opérations en attente
      const userId = await this.getCurrentUserId()

      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      try {
        const pendingOperation = await db.pendingOperations
          .where('entityId')
          .equals(id)
          .and((op) => op.userId === userId)
          .first()

        if (pendingOperation) {
          const payload = pendingOperation.payload as Partial<ProductTransferResponse>

          return {
            id: pendingOperation.entityId,
            code: payload.code ?? '',
            transferType: payload.transferType ?? 'STANDARD',
            senderActorId: payload.senderActorId ?? '',
            senderStoreId: payload.senderStoreId ?? '',
            receiverActorId: payload.receiverActorId ?? '',
            receiverStoreId: payload.receiverStoreId ?? '',
            campaignId: payload.campaignId ?? '',
            transferDate: payload.transferDate ?? new Date().toISOString(),
            driverInfo: payload.driverInfo ?? {
              fullName: '',
              vehicleRegistration: '',
              drivingLicenseNumber: '',
              routeSheetCode: '',
            },
            products: payload.products ?? [],
            status: payload.status ?? 'pending',
            createdAt: payload.createdAt ?? new Date().toISOString(),
            updatedAt: payload.updatedAt ?? new Date().toISOString(),
            syncStatus:
              pendingOperation.operation === 'create'
                ? SyncStatus.PENDING_CREATION
                : SyncStatus.PENDING_UPDATE,
          }
        } else {
          throw new Error('Transfert de produit non trouvé en mode hors ligne')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération offline du transfert:', error)
        throw new Error('Impossible de récupérer le transfert en mode hors ligne')
      }
    }

    // Mode online : récupération depuis l'API
    try {
      const response = await apiClient.get<ProductTransferResponse>(`/product-transfers/${id}`)

      if (!response.success || !response.data) {
        throw new Error('Transfert de produit non trouvé sur le serveur.')
      }

      return this.mapResponseToProductTransfer(response.data)
    } catch (error) {
      console.error('Error fetching product transfer by id:', error)
      throw error
    }
  }

  /**
   * Crée un nouveau transfert de produit (stockage local + file d'attente de sync)
   * Suit le pattern de ConventionRepository - toujours passer par la queue
   */
  async create(
    payload: CreateProductTransferRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4()
    const userId = await this.getCurrentUserId()

    if (!userId) {
      throw new Error(
        'Utilisateur non connecté - impossible de créer un transfert sans userId'
      )
    }

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      payload as unknown as {
        routeSheetDocuments?: Array<{
          base64Data: string
          mimeType: string
          fileName: string
          documentType: string
        }>
      }
    ).routeSheetDocuments

    // Créer le payload pour l'API
    const createRequest: CreateProductTransferRequest & { routeSheetDocuments?: unknown } = {
      ...payload,
    }

    // Ajouter les documents au payload si présents
    if (documentsWithBase64 && documentsWithBase64.length > 0) {
      createRequest.routeSheetDocuments = documentsWithBase64
    }

    const operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries' | 'userId'> = {
      entityId: localId,
      entityType: this.entityType,
      operation: 'create',
      payload: { ...createRequest, id: localId },
    }

    await this.syncService.queueOperation(operation, userId)
  }

  /**
   * Met à jour un transfert de produit
   */
  async update(
    id: string,
    payload: UpdateProductTransferRequest,
    editOffline?: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (!userId) {
      throw new Error(
        'Utilisateur non connecté - impossible de mettre à jour un transfert sans userId'
      )
    }

    // En mode editOffline, on met à jour l'opération pendante existante
    if (editOffline) {
      const existingOperation = await db.pendingOperations
        .where('entityId')
        .equals(id)
        .and((op) => op.userId === userId)
        .first()

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
        }

        // Mettre à jour les champs fournis
        if (payload.transferDate !== undefined) {
          updatedPayload.transferDate = payload.transferDate
        }
        if (payload.senderActorId !== undefined) {
          updatedPayload.senderActorId = payload.senderActorId
        }
        if (payload.receiverActorId !== undefined) {
          updatedPayload.receiverActorId = payload.receiverActorId
        }
        if (payload.receiverStoreId !== undefined) {
          updatedPayload.receiverStoreId = payload.receiverStoreId
        }
        if (payload.products !== undefined) {
          updatedPayload.products = payload.products
        }
        if (payload.driverInfo !== undefined) {
          updatedPayload.driverInfo = payload.driverInfo
        }
        if (payload.status !== undefined) {
          updatedPayload.status = payload.status
        }

        // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
        const documentsWithBase64 = (
          payload as unknown as {
            routeSheetDocuments?: Array<{
              base64Data: string
              mimeType: string
              fileName: string
              documentType: string
            }>
          }
        ).routeSheetDocuments

        if (documentsWithBase64 && documentsWithBase64.length > 0) {
          updatedPayload.routeSheetDocuments = documentsWithBase64
        }

        // Mettre à jour l'opération pendante
        await db.pendingOperations.update(existingOperation.id!, {
          payload: updatedPayload,
          timestamp: Date.now(),
        })

        this.syncService.triggerSync()
        return
      } else {
        throw new Error('Opération pendante non trouvée pour ce transfert')
      }
    }

    // Mode normal : créer une nouvelle opération de mise à jour
    const updateRequest: Record<string, unknown> = {}

    if (payload.transferDate !== undefined) {
      updateRequest.transferDate = payload.transferDate
    }
    if (payload.senderActorId !== undefined) {
      updateRequest.senderActorId = payload.senderActorId
    }
    if (payload.receiverActorId !== undefined) {
      updateRequest.receiverActorId = payload.receiverActorId
    }
    if (payload.receiverStoreId !== undefined) {
      updateRequest.receiverStoreId = payload.receiverStoreId
    }
    if (payload.products !== undefined) {
      updateRequest.products = payload.products
    }
    if (payload.driverInfo !== undefined) {
      updateRequest.driverInfo = payload.driverInfo
    }
    if (payload.status !== undefined) {
      updateRequest.status = payload.status
    }

    // Extraire les documents s'ils sont présents (ajoutés dynamiquement)
    const documentsWithBase64 = (
      payload as unknown as {
        routeSheetDocuments?: Array<{
          base64Data: string
          mimeType: string
          fileName: string
          documentType: string
        }>
      }
    ).routeSheetDocuments

    if (documentsWithBase64 && documentsWithBase64.length > 0) {
      updateRequest.routeSheetDocuments = documentsWithBase64
    }

    const operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries' | 'userId'> = {
      entityId: id,
      entityType: this.entityType,
      operation: 'update',
      payload: updateRequest,
    }

    await this.syncService.queueOperation(operation, userId)
  }

  /**
   * Supprime un transfert de produit
   */
  async delete(id: string, isOnline: boolean): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (!userId) {
      throw new ApiError(SystemErrorCodes.UNAUTHORIZED, 'Utilisateur non connecté')
    }

    if (!isOnline) {
      // Mode offline : ajouter à la queue de synchronisation
      const operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries' | 'userId'> = {
        entityId: id,
        entityType: this.entityType,
        operation: 'delete',
        payload: {},
      }
      await this.syncService.queueOperation(operation, userId)
      return
    }

    // Mode online : supprimer directement via l'API
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour supprimer le transfert"
        )
      }

      const response = await apiClient.delete(`/product-transfers/${id}`)

      if (!response.success) {
        throw new Error('Erreur serveur lors de la suppression du transfert.')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        'Erreur lors de la suppression du transfert'
      )
    }
  }

  /**
   * Met à jour le statut d'un transfert
   */
  async updateStatus(id: string, status: TransferStatus): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier le statut du transfert"
        )
      }

      const response = await apiClient.patch<ProductTransferResponse>(
        `/product-transfers/${id}/status`,
        { status }
      )

      if (!response.success || !response.data) {
        throw new Error('Erreur serveur lors de la mise à jour du statut du transfert.')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        'Erreur lors de la mise à jour du statut du transfert'
      )
    }
  }

  /**
   * Convertit une chaîne base64 en objet File
   */
  private base64ToFile(base64String: string, mimeType: string, fileName: string): File {
    // Extraire les données base64 pures (enlever le préfixe data:image/...;base64,)
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String

    // Convertir base64 en Blob
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // Créer un objet File à partir du Blob
    return new File([blob], fileName, { type: mimeType })
  }

  /**
   * Gère la synchronisation d'une opération pendante
   */
  async handle(operation: PendingOperation): Promise<void> {
    switch (operation.operation) {
      case 'create':
        await this.handleCreate(operation)
        break
      case 'update':
        await this.handleUpdate(operation)
        break
      default:
        throw new Error(`Opération non supportée pour product-transfer: ${operation.operation}`)
    }
  }

  /**
   * Gère la création d'un transfert de produit côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { routeSheetDocuments, ...payload } = operation.payload as unknown as CreateProductTransferRequest & {
      routeSheetDocuments?: Array<{
        base64Data: string
        mimeType: string
        fileName: string
        documentType: string
      }>
    }

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un transfert de produit"
        )
      }

      // ⭐ Résoudre les IDs des acteurs (peuvent être localIds ou serverIds)
      const resolvedSenderActorId = await idResolutionService.resolveActorId(
        payload.senderActorId
      )
      const resolvedReceiverActorId = await idResolutionService.resolveActorId(
        payload.receiverActorId
      )

      // Nettoyer le payload avant l'envoi
      const cleanPayload = {
        ...payload,
        senderActorId: resolvedSenderActorId,
        receiverActorId: resolvedReceiverActorId,
      }

      // Supprimer l'ID local qui n'est pas nécessaire pour l'API
      delete (cleanPayload as Record<string, unknown>).id

      // Supprimer les documents qui seront uploadés séparément
      delete (cleanPayload as Record<string, unknown>).routeSheetDocuments

      // 1. Créer le transfert de produit
      const transferResponse = await apiClient.post<ProductTransferResponse>('/product-transfers', cleanPayload)

      if (!transferResponse.success || !transferResponse.data) {
        throw new Error('Échec de la création du transfert de produit')
      }

      const transferId = transferResponse.data.id

      // 2. Uploader les documents si présents dans le payload
      if (routeSheetDocuments && routeSheetDocuments.length > 0) {
        try {
          // Convertir tous les documents base64 en File
          const files = routeSheetDocuments.map((doc) =>
            this.base64ToFile(doc.base64Data, doc.mimeType, doc.fileName)
          )

          // Extraire les types de documents
          const documentTypes = routeSheetDocuments.map((doc) => doc.documentType)

          // Upload tous les documents en une seule requête via DocumentRepository
          await this.documentRepository.uploadDocuments(
            {
              files,
              documentableType: 'ProductTransfer',
              documentableId: transferId,
              documentTypes,
            },
            true // isOnline
          )
        } catch {
          // On ne bloque pas la création du transfert si les documents échouent
        }
      }
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err
    }
  }

  /**
   * Gère la mise à jour d'un transfert de produit côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const { routeSheetDocuments, ...payload } = operation.payload as unknown as UpdateProductTransferRequest & {
      routeSheetDocuments?: Array<{
        base64Data: string
        mimeType: string
        fileName: string
        documentType: string
      }>
    }

    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier le transfert"
        )
      }

      // ⭐ Résoudre les IDs des acteurs si présents (peuvent être localIds ou serverIds)
      const resolvedPayload = { ...payload }

      if (payload.senderActorId) {
        resolvedPayload.senderActorId = await idResolutionService.resolveActorId(
          payload.senderActorId
        )
      }

      if (payload.receiverActorId) {
        resolvedPayload.receiverActorId = await idResolutionService.resolveActorId(
          payload.receiverActorId
        )
      }

      // Nettoyer le payload avant l'envoi
      const cleanPayload = { ...resolvedPayload }
      delete (cleanPayload as Record<string, unknown>).routeSheetDocuments

      // 1. Mettre à jour le transfert
      const response = await apiClient.put<ProductTransferResponse>(
        `/product-transfers/${operation.entityId}`,
        cleanPayload
      )

      if (!response.success || !response.data) {
        throw new Error('Erreur serveur lors de la mise à jour du transfert.')
      }

      // 2. Uploader les documents si présents dans le payload
      if (routeSheetDocuments && routeSheetDocuments.length > 0) {
        try {
          // Convertir tous les documents base64 en File
          const files = routeSheetDocuments.map((doc) =>
            this.base64ToFile(doc.base64Data, doc.mimeType, doc.fileName)
          )

          // Extraire les types de documents
          const documentTypes = routeSheetDocuments.map((doc) => doc.documentType)

          // Upload tous les documents en une seule requête via DocumentRepository
          await this.documentRepository.uploadDocuments(
            {
              files,
              documentableType: 'ProductTransfer',
              documentableId: operation.entityId,
              documentTypes,
            },
            true // isOnline
          )
        } catch {
          // On ne bloque pas la mise à jour du transfert si les documents échouent
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(SystemErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour du transfert')
    }
  }
}
