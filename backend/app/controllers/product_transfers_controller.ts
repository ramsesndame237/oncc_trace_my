import ProductTransferService from '#services/product_transfer_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import {
  createProductTransferValidator,
  listProductTransfersValidator,
  updateProductTransferValidator,
  updateTransferStatusValidator,
} from '#validators/product_transfer_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

@inject()
export default class ProductTransfersController {
  constructor(protected productTransferService: ProductTransferService) {}

  /**
   * Helper pour charger les relations d'un transfert conditionnellement
   * @param transfer - Le transfert à charger
   */
  private async loadTransferRelations(transfer: any) {
    await transfer.load('senderActor')
    // Charger senderStore uniquement si présent (pas pour GROUPAGE)
    if (transfer.senderStoreId) {
      await transfer.load('senderStore')
    }
    await transfer.load('receiverActor')
    await transfer.load('receiverStore')
    await transfer.load('campaign')
  }

  /**
   * Helper pour préparer les relations à sérialiser conditionnellement
   * @param transfer - Le transfert à sérialiser
   * @param detailed - Si true, inclure plus de champs (pour show)
   */
  private getSerializeRelations(transfer: any, detailed: boolean = false) {
    const relations: any = {
      senderActor: {
        fields: {
          pick: detailed
            ? [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'onccId',
                'identifiantId',
                'phone',
                'email',
                'locationCode',
              ]
            : ['id', 'actorType', 'familyName', 'givenName', 'onccId', 'identifiantId'],
        },
      },
      receiverActor: {
        fields: {
          pick: detailed
            ? [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'onccId',
                'identifiantId',
                'phone',
                'email',
                'locationCode',
              ]
            : ['id', 'actorType', 'familyName', 'givenName', 'onccId', 'identifiantId'],
        },
      },
      receiverStore: {
        fields: {
          pick: detailed
            ? ['id', 'name', 'code', 'locationCode', 'storeType', 'capacity']
            : ['id', 'name', 'code', 'locationCode'],
        },
      },
      campaign: {
        fields: {
          pick: ['id', 'code', 'startDate', 'endDate', 'status'],
        },
      },
    }

    // Ajouter senderStore uniquement si présent (pas pour GROUPAGE)
    if (transfer.senderStoreId) {
      relations.senderStore = {
        fields: {
          pick: detailed
            ? ['id', 'name', 'code', 'locationCode', 'storeType', 'capacity']
            : ['id', 'name', 'code', 'locationCode'],
        },
      }
    }

    return relations
  }

  /**
   * Lister tous les transferts de produits (avec pagination et filtres)
   */
  async index({ request, response }: HttpContext) {
    try {
      const filters = await request.validateUsing(listProductTransfersValidator)

      // Convertir les dates en ISO string pour le service
      const serviceFilters = {
        ...filters,
        startDate: filters.startDate
          ? DateTime.fromJSDate(filters.startDate).toISODate()!
          : undefined,
        endDate: filters.endDate ? DateTime.fromJSDate(filters.endDate).toISODate()! : undefined,
      }

      const result = await this.productTransferService.list(serviceFilters)

      return ApiResponse.success(response, SuccessCodes.PRODUCT_TRANSFER_LIST_SUCCESS, {
        data: result.data.map((transfer) =>
          transfer.serialize({ relations: this.getSerializeRelations(transfer) })
        ),
        meta: result.meta,
      })
    } catch (error) {
      console.error('Erreur récupération transferts de produits:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_LIST_FAILED)
    }
  }

  /**
   * Créer un nouveau transfert de produit
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const payload = await request.validateUsing(createProductTransferValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Convertir la date en ISO string pour le service
      const data = {
        ...payload,
        transferDate: DateTime.fromJSDate(payload.transferDate).toISODate()!,
      }

      // Créer le transfert via le service avec audit log intégré
      const transfer = await this.productTransferService.create(data, auditContext)

      // Charger les relations pour la réponse
      await this.loadTransferRelations(transfer)

      // Émettre les événements de notification selon le type de transfert
      try {
        const senderActor = transfer.senderActor as any
        const receiverActor = transfer.receiverActor as any
        const receiverStore = transfer.receiverStore as any
        const campaign = transfer.campaign as any

        // Mapper les produits au format attendu par l'événement
        const mappedProducts = (transfer.products || []).map((product) => ({
          productType: product.quality,
          quantity: product.weight,
          unit: 'kg',
        }))

        if (transfer.transferType === 'GROUPAGE') {
          // Notification uniquement au receiver (OPA)
          emitter.emit('product-transfer:groupage-created', {
            transferId: transfer.id,
            transferCode: transfer.code,
            transferDate: transfer.transferDate.toFormat('yyyy-MM-dd'),
            senderActorId: senderActor.id,
            senderActorName: `${senderActor.familyName} ${senderActor.givenName}`,
            receiverActorId: receiverActor.id,
            receiverActorName: `${receiverActor.familyName} ${receiverActor.givenName}`,
            receiverStoreId: receiverStore.id,
            receiverStoreName: receiverStore.name,
            campaignId: campaign.id,
            campaignCode: campaign.code,
            products: mappedProducts,
          })
        } else if (transfer.transferType === 'STANDARD') {
          const senderStore = transfer.senderStore as any

          // Notification au sender ET au receiver (driverInfo peut être absent pour certains cas)
          emitter.emit('product-transfer:standard-created', {
            transferId: transfer.id,
            transferCode: transfer.code,
            transferDate: transfer.transferDate.toFormat('yyyy-MM-dd'),
            senderActorId: senderActor.id,
            senderActorName: `${senderActor.familyName} ${senderActor.givenName}`,
            senderStoreId: senderStore.id,
            senderStoreName: senderStore.name,
            receiverActorId: receiverActor.id,
            receiverActorName: `${receiverActor.familyName} ${receiverActor.givenName}`,
            receiverStoreId: receiverStore.id,
            receiverStoreName: receiverStore.name,
            campaignId: campaign.id,
            campaignCode: campaign.code,
            products: mappedProducts,
            driverInfo: transfer.driverInfo || undefined,
          })
        }
      } catch (error) {
        console.error("Erreur lors de l'émission des événements de transfert:", error)
      }

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCT_TRANSFER_CREATE_SUCCESS,
        transfer.serialize({ relations: this.getSerializeRelations(transfer) }),
        201
      )
    } catch (error) {
      console.error('Erreur création transfert de produit:', error)

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_REQUIRED) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_REQUIRED
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_PRODUCTS_REQUIRED) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_PRODUCTS_REQUIRED
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_CREATE_FAILED)
    }
  }

  /**
   * Afficher un transfert de produit spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const transfer = await this.productTransferService.findById(params.id)

      if (!transfer) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND,
          404,
          'Transfert de produit non trouvé'
        )
      }

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCT_TRANSFER_SHOW_SUCCESS,
        transfer.serialize({ relations: this.getSerializeRelations(transfer, true) })
      )
    } catch (error) {
      console.error('Erreur récupération transfert de produit:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_SHOW_FAILED)
    }
  }

  /**
   * Mettre à jour un transfert de produit
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const payload = await request.validateUsing(updateProductTransferValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Convertir la date en ISO string si fournie
      const data = {
        ...payload,
        transferDate: payload.transferDate
          ? DateTime.fromJSDate(payload.transferDate).toISODate()!
          : undefined,
      }

      // Mettre à jour le transfert via le service avec audit log intégré
      // Note: campaignId et transferType ne peuvent pas être modifiés
      // Note: transferDate peut être modifié pour les transferts GROUPAGE
      const transfer = await this.productTransferService.update(params.id, data, auditContext)

      // Charger les relations pour la réponse
      await this.loadTransferRelations(transfer)

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCT_TRANSFER_UPDATE_SUCCESS,
        transfer.serialize({ relations: this.getSerializeRelations(transfer) })
      )
    } catch (error) {
      console.error('Erreur mise à jour transfert de produit:', error)

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND)
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_NOT_EDITABLE) {
        return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_NOT_EDITABLE)
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND
        )
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_UPDATE_FAILED)
    }
  }

  /**
   * Mettre à jour le statut d'un transfert de produit
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const data = await request.validateUsing(updateTransferStatusValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Mettre à jour le statut via le service avec audit log intégré
      const transfer = await this.productTransferService.updateStatus(params.id, data, auditContext)

      // Charger les relations pour la réponse
      await this.loadTransferRelations(transfer)

      // Émettre les événements de notification d'annulation selon le type de transfert
      if (data.status === 'cancelled') {
        try {
          const senderActor = transfer.senderActor as any
          const receiverActor = transfer.receiverActor as any
          const receiverStore = transfer.receiverStore as any
          const campaign = transfer.campaign as any

          // Mapper les produits au format attendu par l'événement
          const mappedProducts = (transfer.products || []).map((product) => ({
            productType: product.quality,
            quantity: product.weight,
            unit: 'kg',
          }))

          if (transfer.transferType === 'GROUPAGE') {
            // Notification uniquement au receiver (OPA)
            emitter.emit('product-transfer:groupage-cancelled', {
              transferId: transfer.id,
              transferCode: transfer.code,
              transferDate: transfer.transferDate.toFormat('yyyy-MM-dd'),
              senderActorId: senderActor.id,
              senderActorName: `${senderActor.familyName} ${senderActor.givenName}`,
              receiverActorId: receiverActor.id,
              receiverActorName: `${receiverActor.familyName} ${receiverActor.givenName}`,
              receiverStoreId: receiverStore.id,
              receiverStoreName: receiverStore.name,
              campaignId: campaign.id,
              campaignCode: campaign.code,
              products: mappedProducts,
            })
          } else if (transfer.transferType === 'STANDARD') {
            const senderStore = transfer.senderStore as any

            // Notification au sender ET au receiver (driverInfo peut être absent pour certains cas)
            emitter.emit('product-transfer:standard-cancelled', {
              transferId: transfer.id,
              transferCode: transfer.code,
              transferDate: transfer.transferDate.toFormat('yyyy-MM-dd'),
              senderActorId: senderActor.id,
              senderActorName: `${senderActor.familyName} ${senderActor.givenName}`,
              senderStoreId: senderStore.id,
              senderStoreName: senderStore.name,
              receiverActorId: receiverActor.id,
              receiverActorName: `${receiverActor.familyName} ${receiverActor.givenName}`,
              receiverStoreId: receiverStore.id,
              receiverStoreName: receiverStore.name,
              campaignId: campaign.id,
              campaignCode: campaign.code,
              products: mappedProducts,
              driverInfo: transfer.driverInfo || undefined,
            })
          }
        } catch (error) {
          console.error("Erreur lors de l'émission des événements d'annulation:", error)
        }
      }

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCT_TRANSFER_STATUS_UPDATE_SUCCESS,
        transfer.serialize({ relations: this.getSerializeRelations(transfer) })
      )
    } catch (error) {
      console.error('Erreur mise à jour statut transfert de produit:', error)

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND)
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION
        )
      }

      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.PRODUCT_TRANSFER_STATUS_UPDATE_FAILED
      )
    }
  }

  /**
   * Supprimer un transfert de produit (soft delete)
   */
  async destroy({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Supprimer le transfert via le service avec audit log intégré
      await this.productTransferService.delete(params.id, auditContext)

      return ApiResponse.success(response, SuccessCodes.PRODUCT_TRANSFER_DELETE_SUCCESS, null, 204)
    } catch (error) {
      console.error('Erreur suppression transfert de produit:', error)

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_NOT_FOUND)
      }

      if (error.message === ErrorCodes.PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCT_TRANSFER_DELETE_FAILED)
    }
  }
}
