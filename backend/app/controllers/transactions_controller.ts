import TransactionService from '#services/transaction_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import {
  cancelTransactionValidator,
  confirmTransactionValidator,
  createTransactionValidator,
  listTransactionsValidator,
  updateTransactionProductsValidator,
  updateTransactionValidator,
} from '#validators/transaction_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

@inject()
export default class TransactionsController {
  constructor(protected transactionService: TransactionService) {}

  /**
   * Lister toutes les transactions (avec pagination et filtres)
   * GET /api/v1/transactions
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Valider les paramètres de requête
      const filters = await request.validateUsing(listTransactionsValidator)

      // Convertir les dates en strings ISO pour le service
      const filtersForService = {
        ...filters,
        startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
      }

      // Ajouter le filtrage par rôle
      const { transactions, pendingComplementaryIds } = await this.transactionService.list(
        filtersForService,
        authUser
      )

      // Sérialiser les transactions avec l'attribut isPendingComplementary
      const serializedData = transactions.serialize({
        relations: {
          products: {
            fields: [
              'id',
              'quality',
              'standard',
              'weight',
              'bagCount',
              'pricePerKg',
              'totalPrice',
              'humidity',
              'producerId',
            ],
          },
          seller: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
          },
          buyer: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
          },
          campaign: {
            fields: ['id', 'code', 'startDate', 'endDate'],
          },
          calendar: {
            fields: [
              'id',
              'code',
              'type',
              'startDate',
              'endDate',
              'eventTime',
              'locationCode',
              'location',
              'campaignId',
              'conventionId',
              'opaId',
              'expectedSalesCount',
              'status',
            ],
          },
          convention: {
            fields: ['id', 'buyerExporterId', 'producersId', 'signatureDate'],
          },
        },
      })

      // Ajouter l'attribut isPendingComplementary et isMyTransaction à chaque transaction
      if (serializedData.data && Array.isArray(serializedData.data)) {
        serializedData.data = serializedData.data.map((transaction: any) => ({
          ...transaction,
          isPendingComplementary: pendingComplementaryIds.includes(transaction.id),
          isMyTransaction: transaction.createdByActorId === authUser.actorId,
          isEditable:
            transaction.createdByActorId === authUser.actorId && transaction.status === 'pending',
        }))
      }

      return ApiResponse.success(response, SuccessCodes.TRANSACTION_LIST_SUCCESS, serializedData)
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs d'autorisation (bassin ou acteur manquant)
      if (error.code === ErrorCodes.SYSTEM_FORBIDDEN) {
        return ApiResponse.error(response, ErrorCodes.SYSTEM_FORBIDDEN, 403, error.message)
      }

      console.error('Erreur récupération transactions:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_LIST_FAILED)
    }
  }

  /**
   * Créer une nouvelle transaction
   * POST /api/v1/transactions
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!
      const authUser = auth.use('api').user!

      const data = await request.validateUsing(createTransactionValidator)

      // Transformer null en undefined et Date en string pour la compatibilité de type
      const createData = {
        ...data,
        campaignId: data.campaignId || undefined,
        principalExporterId:
          data.principalExporterId === null ? undefined : data.principalExporterId,
        calendarId: data.calendarId === null ? undefined : data.calendarId,
        conventionId: data.conventionId === null ? undefined : data.conventionId,
        notes: data.notes === null ? undefined : data.notes,
        transactionDate: data.transactionDate.toISOString().split('T')[0],
        products: data.products.map((product) => ({
          ...product,
          producerId: product.producerId === null ? undefined : product.producerId,
          humidity: product.humidity === null ? undefined : product.humidity,
          notes: product.notes === null ? undefined : product.notes,
        })),
      }

      const transaction = await this.transactionService.create(
        createData,
        user.id,
        authUser.actorId || undefined
      )

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_CREATE_SUCCESS,
        transaction.serialize({
          relations: {
            products: {
              fields: [
                'id',
                'quality',
                'standard',
                'weight',
                'bagCount',
                'pricePerKg',
                'totalPrice',
                'humidity',
                'producerId',
                'notes',
              ],
            },
            seller: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            buyer: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            createdByActor: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            campaign: {
              fields: ['id', 'code', 'startDate', 'endDate'],
            },
            calendar: {
              fields: [
                'id',
                'code',
                'type',
                'startDate',
                'endDate',
                'eventTime',
                'locationCode',
                'location',
                'campaignId',
                'conventionId',
                'opaId',
                'expectedSalesCount',
                'status',
              ],
            },
            convention: {
              fields: ['id', 'code', 'buyerExporterId', 'producersId', 'signatureDate'],
            },
          },
        }),
        201
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs métier spécifiques
      if (error.code === ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_SELLER_BUYER_SAME) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_SELLER_BUYER_SAME
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_PRODUCER_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_PRODUCER_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_ACTIVE
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_ACTIVE
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE
        )
      }

      console.error('Erreur création transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_CREATION_FAILED)
    }
  }

  /**
   * Afficher une transaction spécifique
   * GET /api/v1/transactions/:id
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const transaction = await this.transactionService.getById(params.id)

      // Calculer isPendingComplementary pour actor_manager
      let isPendingComplementary = false
      let isMyTransaction = false
      let isEditable = false

      if (authUser.role === 'actor_manager' && authUser.actorId) {
        isMyTransaction = transaction.createdByActorId === authUser.actorId
        isEditable = isMyTransaction && transaction.status === 'pending'

        // Si la transaction est confirmée, l'acteur est seller ou buyer, et n'est pas le créateur
        if (
          transaction.status === 'confirmed' &&
          (transaction.sellerId === authUser.actorId ||
            transaction.buyerId === authUser.actorId) &&
          transaction.createdByActorId !== authUser.actorId
        ) {
          // Vérifier s'il existe déjà une transaction complémentaire créée par cet acteur (peu importe le statut)
          const complementaryTransactions =
            await this.transactionService.findAllComplementaryTransactions(transaction.id)

          const hasComplementaryByMe = complementaryTransactions.some(
            (t) => t.createdByActorId === authUser.actorId
          )

          isPendingComplementary = !hasComplementaryByMe
        }
      }

      const serializedTransaction = transaction.serialize({
        relations: {
          products: {
            fields: [
              'id',
              'quality',
              'standard',
              'weight',
              'bagCount',
              'pricePerKg',
              'totalPrice',
              'humidity',
              'producerId',
              'notes',
            ],
            relations: {
              producer: {
                fields: ['id', 'familyName', 'givenName', 'onccId'],
              },
            },
          },
          seller: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId', 'email', 'phone'],
          },
          buyer: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId', 'email', 'phone'],
          },
          principalExporter: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
          },
          createdByActor: {
            fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
          },
          campaign: {
            fields: ['id', 'code', 'startDate', 'endDate', 'status'],
          },
          calendar: {
            fields: [
              'id',
              'code',
              'type',
              'startDate',
              'endDate',
              'eventTime',
              'locationCode',
              'location',
              'campaignId',
              'conventionId',
              'opaId',
              'expectedSalesCount',
              'status',
            ],
          },
          convention: {
            fields: ['id', 'code', 'buyerExporterId', 'producersId', 'signatureDate'],
          },
        },
      })

      // Ajouter les attributs calculés
      return ApiResponse.success(response, SuccessCodes.TRANSACTION_SHOW_SUCCESS, {
        ...serializedTransaction,
        isPendingComplementary,
        isMyTransaction,
        isEditable,
      })
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur récupération transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_NOT_FOUND)
    }
  }

  /**
   * Mettre à jour une transaction
   * PUT /api/v1/transactions/:id
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      const data = await request.validateUsing(updateTransactionValidator)

      // Transformer null en undefined et Date en string pour la compatibilité de type
      const updateData = {
        ...data,
        notes: data.notes === null ? undefined : data.notes,
        transactionDate: data.transactionDate
          ? data.transactionDate.toISOString().split('T')[0]
          : undefined,
      }

      const transaction = await this.transactionService.update(params.id, updateData, user.id)

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_UPDATE_SUCCESS,
        transaction.serialize()
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur mise à jour transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_UPDATE_FAILED)
    }
  }

  /**
   * Confirmer une transaction
   * POST /api/v1/transactions/:id/confirm
   */
  async confirm({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      const data = await request.validateUsing(confirmTransactionValidator)

      const transaction = await this.transactionService.confirm(
        params.id,
        user.id,
        data.notes === null ? undefined : data.notes
      )

      // Charger les relations pour l'événement de notification
      await transaction.load('seller')
      await transaction.load('buyer')
      await transaction.load('campaign')
      await transaction.load('products')

      // Émettre l'événement de transaction validée pour envoyer les notifications
      try {
        const seller = transaction.seller as any
        const buyer = transaction.buyer as any
        const campaign = transaction.campaign as any
        const products = (transaction.products || []) as any[]

        // Mapper les produits au format attendu par l'événement
        const mappedProducts = products.map((product) => ({
          productType: product.productType || 'Non spécifié',
          quality: product.quality || 'Non spécifié',
          weight: product.weight || 0,
          numberOfBags: product.bagCount || 0,
          unitPrice: product.pricePerKg || 0,
          totalPrice: product.totalPrice || 0,
        }))

        // Calculer le montant total en sommant les prix totaux des produits
        const totalAmount = mappedProducts.reduce((sum, product) => sum + product.totalPrice, 0)

        // Déterminer le locationName selon le locationType
        let locationName: string | undefined
        if (transaction.locationType === 'MARKET' && transaction.calendar) {
          await transaction.load('calendar')
          const calendar = transaction.calendar as any
          locationName = calendar?.location || undefined
        } else if (transaction.locationType === 'CONVENTION' && transaction.convention) {
          await transaction.load('convention')
          const convention = transaction.convention as any
          locationName = convention?.code || undefined
        } else if (transaction.locationType === 'OUTSIDE_MARKET') {
          locationName = 'Hors marché'
        }

        emitter.emit('transaction:validated', {
          transactionId: transaction.id,
          transactionCode: transaction.code,
          transactionType: transaction.transactionType,
          transactionDate: transaction.transactionDate.toFormat('yyyy-MM-dd'),
          sellerId: seller.id,
          sellerName: `${seller.familyName} ${seller.givenName}`,
          buyerId: buyer.id,
          buyerName: `${buyer.familyName} ${buyer.givenName}`,
          campaignId: campaign.id,
          campaignCode: campaign.code,
          locationType: transaction.locationType,
          locationName,
          products: mappedProducts,
          totalAmount,
        })
      } catch (eventError) {
        console.error(
          "Erreur lors de l'émission de l'événement de transaction validée:",
          eventError
        )
        // Ne pas bloquer la réponse si l'événement échoue
      }

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_CONFIRM_SUCCESS,
        transaction.serialize()
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs métier spécifiques
      if (error.code === ErrorCodes.TRANSACTION_CONFIRM_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      if (error.code === ErrorCodes.TRANSACTION_CONFIRM_NOT_PENDING) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_CONFIRM_NOT_PENDING
        )
      }

      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur confirmation transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_CONFIRM_FAILED)
    }
  }

  /**
   * Annuler une transaction
   * POST /api/v1/transactions/:id/cancel
   */
  async cancel({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      const data = await request.validateUsing(cancelTransactionValidator)

      const transaction = await this.transactionService.cancel(params.id, user.id, data.reason)

      // Charger les relations pour l'événement de notification
      await transaction.load('seller')
      await transaction.load('buyer')
      await transaction.load('campaign')
      await transaction.load('products')

      // Émettre l'événement de transaction annulée pour envoyer la notification
      try {
        const seller = transaction.seller as any
        const buyer = transaction.buyer as any
        const campaign = transaction.campaign as any
        const products = (transaction.products || []) as any[]

        // Mapper les produits au format attendu par l'événement
        const mappedProducts = products.map((product) => ({
          productType: product.productType || 'Non spécifié',
          quality: product.quality || 'Non spécifié',
          weight: product.weight || 0,
          numberOfBags: product.bagCount || 0,
          unitPrice: product.pricePerKg || 0,
          totalPrice: product.totalPrice || 0,
        }))

        // Calculer le montant total en sommant les prix totaux des produits
        const totalAmount = mappedProducts.reduce((sum, product) => sum + product.totalPrice, 0)

        // Déterminer le locationName selon le locationType
        let locationName: string | undefined
        if (transaction.locationType === 'MARKET' && transaction.calendar) {
          await transaction.load('calendar')
          const calendar = transaction.calendar as any
          locationName = calendar?.location || undefined
        } else if (transaction.locationType === 'CONVENTION' && transaction.convention) {
          await transaction.load('convention')
          const convention = transaction.convention as any
          locationName = convention?.code || undefined
        } else if (transaction.locationType === 'OUTSIDE_MARKET') {
          locationName = 'Hors marché'
        }

        // Vérifier s'il existe une transaction complémentaire confirmée
        const complementaryTransactions =
          await this.transactionService.findConfirmedComplementaryTransactions(transaction.id)
        const hasComplementaryTransaction = complementaryTransactions.length > 0

        emitter.emit('transaction:cancelled', {
          transactionId: transaction.id,
          transactionCode: transaction.code,
          transactionType: transaction.transactionType,
          transactionDate: transaction.transactionDate.toFormat('yyyy-MM-dd'),
          sellerId: seller.id,
          sellerName: `${seller.familyName} ${seller.givenName}`,
          buyerId: buyer.id,
          buyerName: `${buyer.familyName} ${buyer.givenName}`,
          campaignId: campaign.id,
          campaignCode: campaign.code,
          locationType: transaction.locationType,
          locationName,
          products: mappedProducts,
          totalAmount,
          cancellationReason: data.reason,
          hasComplementaryTransaction,
        })
      } catch (eventError) {
        console.error(
          "Erreur lors de l'émission de l'événement de transaction annulée:",
          eventError
        )
        // Ne pas bloquer la réponse si l'événement échoue
      }

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_CANCEL_SUCCESS,
        transaction.serialize()
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur annulation transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_CANCEL_FAILED)
    }
  }

  /**
   * Supprimer une transaction (soft delete)
   * DELETE /api/v1/transactions/:id
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      await this.transactionService.delete(params.id, user.id)

      return ApiResponse.success(response, SuccessCodes.TRANSACTION_DELETE_SUCCESS, null)
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur suppression transaction:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_DELETE_FAILED)
    }
  }

  /**
   * Obtenir les transactions complémentaires confirmées
   * GET /api/v1/transactions/:id/complementary
   */
  async complementary({ params, response }: HttpContext) {
    try {
      const transactions = await this.transactionService.findConfirmedComplementaryTransactions(
        params.id
      )

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_COMPLEMENTARY_SUCCESS,
        transactions.map((t) =>
          t.serialize({
            relations: {
              seller: {
                fields: ['id', 'actorType', 'familyName', 'givenName'],
              },
              buyer: {
                fields: ['id', 'actorType', 'familyName', 'givenName'],
              },
            },
          })
        )
      )
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_NOT_FOUND)
      }

      console.error('Erreur récupération transactions complémentaires:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.TRANSACTION_NOT_FOUND)
    }
  }

  /**
   * Mettre à jour les produits d'une transaction
   * PUT /api/v1/transactions/:id/products
   */
  async updateProducts({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      const data = await request.validateUsing(updateTransactionProductsValidator)

      // Transformer les produits pour la compatibilité de type
      const productsData = data.products.map((product) => ({
        ...product,
        producerId: product.producerId === null ? undefined : product.producerId,
        humidity: product.humidity === null ? undefined : product.humidity,
        notes: product.notes === null ? undefined : product.notes,
      }))

      const transaction = await this.transactionService.updateProducts(
        params.id,
        productsData,
        user.id
      )

      return ApiResponse.success(
        response,
        SuccessCodes.TRANSACTION_UPDATE_PRODUCTS_SUCCESS,
        transaction.serialize({
          relations: {
            products: {
              fields: [
                'id',
                'quality',
                'standard',
                'weight',
                'bagCount',
                'pricePerKg',
                'totalPrice',
                'humidity',
                'producerId',
                'notes',
              ],
              relations: {
                producer: {
                  fields: ['id', 'familyName', 'givenName', 'onccId'],
                },
              },
            },
            seller: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            buyer: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            createdByActor: {
              fields: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
            },
            campaign: {
              fields: ['id', 'code', 'startDate', 'endDate'],
            },
            calendar: {
              fields: [
                'id',
                'code',
                'type',
                'startDate',
                'endDate',
                'eventTime',
                'locationCode',
                'location',
                'campaignId',
                'conventionId',
                'opaId',
                'expectedSalesCount',
                'status',
              ],
            },
            convention: {
              fields: ['id', 'code', 'buyerExporterId', 'producersId', 'signatureDate'],
            },
          },
        })
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs métier spécifiques
      if (error.code === ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND)
      }

      if (error.code === ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA
        )
      }

      if (error.code === ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND
        )
      }

      console.error('Erreur mise à jour produits transaction:', error)
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_FAILED
      )
    }
  }
}
