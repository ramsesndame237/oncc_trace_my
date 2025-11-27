import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Calendar from '#models/calendar'
import Campaign from '#models/campaign'
import Convention from '#models/convention'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import User from '#models/user'
import ProductionBasinService from '#services/production_basin_service'
import { ErrorCodes } from '#types/errors/index'
import type {
  CreateTransactionData,
  TransactionLocationType,
  TransactionProductData,
  TransactionType,
  UpdateTransactionData,
} from '#types/transaction_types'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

@inject()
export default class TransactionService {
  constructor(protected productionBasinService: ProductionBasinService) {}
  /**
   * Générer un code unique pour la transaction
   */
  private async generateTransactionCode(campaignId: string): Promise<string> {
    const campaign = await Campaign.findOrFail(campaignId)
    const year = campaign.startDate.year

    // Compter les transactions de cette année
    const result = await db
      .from('transactions')
      .whereRaw(`code LIKE ?`, [`TX-${year}-%`])
      .count('* as total')
      .first()

    const count = result ? Number(result.total) : 0
    const sequence = (count + 1).toString().padStart(6, '0')

    return `TX-${year}-${sequence}`
  }

  /**
   * Valider que la limite de transactions complémentaires n'est pas atteinte
   * La logique est : pour un couple vendeur/acheteur donné, il ne peut y avoir qu'une seule
   * transaction de chaque type (SALE et PURCHASE) avec les mêmes critères.
   * Donc on vérifie s'il existe déjà une transaction du MÊME TYPE (pas opposé).
   */
  private async validateComplementaryTransaction(data: CreateTransactionData): Promise<void> {
    // Chercher les transactions du MÊME TYPE (pas opposé) pour voir si une existe déjà
    const query = Transaction.query()
      .where('seller_id', data.sellerId)
      .where('buyer_id', data.buyerId)
      .where('campaign_id', data.campaignId!)
      .where('location_type', data.locationType)
      .where('transaction_type', data.transactionType) // Même type
      .whereNull('deleted_at')

    // Contraintes spécifiques selon le locationType
    if (data.locationType === 'OUTSIDE_MARKET') {
      // OUTSIDE_MARKET: doit avoir la même date
      const transactionDate = DateTime.fromISO(data.transactionDate)
      const isoDate = transactionDate.toISODate()
      if (isoDate) {
        query.whereRaw('DATE(transaction_date) = ?', [isoDate])
      }
    } else if (data.locationType === 'MARKET') {
      // MARKET: doit avoir le même calendar_id
      if (data.calendarId) {
        query.where('calendar_id', data.calendarId)
      } else {
        query.whereNull('calendar_id')
      }
    } else if (data.locationType === 'CONVENTION') {
      // CONVENTION: doit avoir le même calendar_id ET convention_id
      if (data.calendarId) {
        query.where('calendar_id', data.calendarId)
      } else {
        query.whereNull('calendar_id')
      }

      if (data.conventionId) {
        query.where('convention_id', data.conventionId)
      } else {
        query.whereNull('convention_id')
      }
    }

    // Gérer principal_exporter_id (pour tous les types)
    if (data.principalExporterId) {
      query.where('principal_exporter_id', data.principalExporterId)
    } else {
      query.whereNull('principal_exporter_id')
    }

    const existingTransactions = await query

    // S'il existe déjà une transaction du même type avec les mêmes critères, bloquer
    if (existingTransactions.length > 0) {
      throw new Exception(
        `Une transaction de type ${data.transactionType} existe déjà pour ce couple vendeur/acheteur avec les mêmes critères`,
        {
          code: ErrorCodes.TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED,
          status: 400,
        }
      )
    }
  }

  /**
   * Créer une transaction avec ses produits
   */
  async create(
    data: CreateTransactionData,
    userId: string,
    actorId?: string
  ): Promise<Transaction> {
    // Si campaignId n'est pas fourni, déduire la campagne active
    let campaignId = data.campaignId
    if (!campaignId) {
      const activeCampaign = await Campaign.query().where('status', 'active').first()
      if (!activeCampaign) {
        throw new Exception('Aucune campagne active trouvée', {
          code: ErrorCodes.TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND,
          status: 400,
        })
      }
      campaignId = activeCampaign.id
      // Mettre à jour data.campaignId pour la cohérence dans les validations
      data.campaignId = campaignId
    }

    // Validations
    if (data.sellerId === data.buyerId) {
      throw new Exception("Le vendeur et l'acheteur doivent être différents", {
        code: ErrorCodes.TRANSACTION_CREATE_SELLER_BUYER_SAME,
        status: 400,
      })
    }

    // Vérifier que le vendeur existe
    const seller = await Actor.find(data.sellerId)
    if (!seller) {
      throw new Exception('Vendeur non trouvé', {
        code: ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_FOUND,
        status: 400,
      })
    }

    // Vérifier que le vendeur est actif
    if (seller.status !== 'active') {
      throw new Exception("Le vendeur n'est pas actif", {
        code: ErrorCodes.TRANSACTION_CREATE_SELLER_NOT_ACTIVE,
        status: 400,
      })
    }

    // Vérifier que l'acheteur existe
    const buyer = await Actor.find(data.buyerId)
    if (!buyer) {
      throw new Exception('Acheteur non trouvé', {
        code: ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_FOUND,
        status: 400,
      })
    }

    // Vérifier que l'acheteur est actif
    if (buyer.status !== 'active') {
      throw new Exception("L'acheteur n'est pas actif", {
        code: ErrorCodes.TRANSACTION_CREATE_BUYER_NOT_ACTIVE,
        status: 400,
      })
    }

    // Vérifier que la campagne existe
    const campaign = await Campaign.find(campaignId)
    if (!campaign) {
      throw new Exception('Campagne non trouvée', {
        code: ErrorCodes.TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND,
        status: 400,
      })
    }

    // Vérifier que le calendrier existe et est actif (si fourni)
    if (data.calendarId) {
      const calendar = await Calendar.find(data.calendarId)
      if (!calendar) {
        throw new Exception('Calendrier non trouvé', {
          code: ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_FOUND,
          status: 400,
        })
      }
      if (calendar.status !== 'active') {
        throw new Exception("Le calendrier n'est pas actif", {
          code: ErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE,
          status: 400,
        })
      }
    }

    // Vérifier que la convention est associée à la campagne (si fournie)
    if (data.conventionId) {
      const convention = await Convention.find(data.conventionId)
      if (!convention) {
        throw new Exception('Convention non trouvée', {
          code: ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_FOUND,
          status: 400,
        })
      }
      // Vérifier que la convention est associée à la campagne en cours
      await convention.load('campaigns')
      const isConventionAssociatedWithCampaign = convention.campaigns.some(
        (camp) => camp.id === campaignId
      )
      if (!isConventionAssociatedWithCampaign) {
        throw new Exception("La convention n'est pas associée à la campagne en cours", {
          code: ErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE,
          status: 400,
        })
      }
    }

    // Si vendeur est OPA ET c'est une VENTE, vérifier que tous les produits ont un producer_id
    // Pour les ACHATS, le producteur n'est pas requis car l'OPA achète les produits
    if (seller.actorType === 'PRODUCERS' && data.transactionType === 'SALE') {
      for (const product of data.products) {
        if (!product.producerId) {
          throw new Exception(
            'Un producteur doit être spécifié pour chaque produit quand le vendeur est une OPA',
            {
              code: ErrorCodes.TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA,
              status: 400,
            }
          )
        }

        // Vérifier que le producteur existe
        const producer = await Actor.find(product.producerId)
        if (!producer || producer.actorType !== 'PRODUCER') {
          throw new Exception('Producteur non trouvé', {
            code: ErrorCodes.TRANSACTION_CREATE_PRODUCER_NOT_FOUND,
            status: 400,
          })
        }
      }
    }

    // Valider que la limite de transactions complémentaires n'est pas atteinte
    await this.validateComplementaryTransaction(data)

    const trx = await db.transaction()

    try {
      // Générer le code
      const code = await this.generateTransactionCode(campaignId)

      // Créer la transaction
      // Si l'utilisateur n'a pas d'actorId (technical_admin, basin_admin, field_agent),
      // utiliser le sellerId (pour SALE) ou buyerId (pour PURCHASE) comme createdByActorId
      const effectiveCreatedByActorId =
        actorId || (data.transactionType === 'SALE' ? data.sellerId : data.buyerId)

      const transaction = await Transaction.create(
        {
          code,
          transactionType: data.transactionType,
          locationType: data.locationType,
          sellerId: data.sellerId,
          buyerId: data.buyerId,
          principalExporterId: data.principalExporterId || null,
          createdByActorId: effectiveCreatedByActorId,
          campaignId: data.campaignId,
          calendarId: data.calendarId || null,
          conventionId: data.conventionId || null,
          status: data.status || 'pending',
          transactionDate: DateTime.fromISO(data.transactionDate),
          notes: data.notes || null,
        },
        { client: trx }
      )

      // Créer les produits
      for (const product of data.products) {
        await TransactionProduct.create(
          {
            transactionId: transaction.id,
            quality: product.quality,
            standard: product.standard,
            weight: product.weight,
            bagCount: product.bagCount,
            pricePerKg: product.pricePerKg,
            totalPrice: product.totalPrice,
            producerId: product.producerId || null,
            humidity: product.humidity || null,
            notes: product.notes || null,
          },
          { client: trx }
        )
      }

      // Audit log
      await AuditLog.create(
        {
          auditableType: 'transaction',
          auditableId: transaction.id,
          action: 'create',
          userId,
        },
        { client: trx }
      )

      await trx.commit()

      // Recharger avec les relations
      await transaction.load('products')
      await transaction.load('seller')
      await transaction.load('buyer')
      await transaction.load('createdByActor')
      await transaction.load('campaign')
      await transaction.load('calendar')
      await transaction.load('convention')

      return transaction
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Confirmer une transaction
   */
  async confirm(transactionId: string, userId: string, notes?: string): Promise<Transaction> {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_CONFIRM_NOT_FOUND,
        status: 404,
      })
    }

    if (transaction.status !== 'pending') {
      throw new Exception('Seule une transaction en attente peut être confirmée', {
        code: ErrorCodes.TRANSACTION_CONFIRM_NOT_PENDING,
        status: 400,
      })
    }

    transaction.status = 'confirmed'
    if (notes) {
      transaction.notes = notes
    }
    await transaction.save()

    // Audit log
    await AuditLog.create({
      auditableType: 'transaction',
      auditableId: transaction.id,
      action: 'update_status',
      newValues: {
        status: 'confirmed',
        ...(notes && { notes }),
      },
      userId,
    })

    return transaction
  }

  /**
   * Annuler une transaction (N'affecte PAS les transactions complémentaires)
   */
  async cancel(transactionId: string, userId: string, reason: string): Promise<Transaction> {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_CANCEL_NOT_FOUND,
        status: 404,
      })
    }

    transaction.status = 'cancelled'
    await transaction.save()

    // Audit log
    await AuditLog.create({
      auditableType: 'transaction',
      auditableId: transaction.id,
      action: 'update_status',
      newValues: { status: 'cancelled', reason },
      userId,
    })

    return transaction
  }

  /**
   * Trouver les transactions complémentaires confirmées
   */
  async findConfirmedComplementaryTransactions(transactionId: string): Promise<Transaction[]> {
    const transaction = await Transaction.findOrFail(transactionId)
    const oppositeType: TransactionType =
      transaction.transactionType === 'SALE' ? 'PURCHASE' : 'SALE'

    const query = Transaction.query()
      .where('id', '!=', transactionId)
      .where('seller_id', transaction.sellerId)
      .where('buyer_id', transaction.buyerId)
      .where('campaign_id', transaction.campaignId)
      .where('location_type', transaction.locationType)
      .where('transaction_type', oppositeType)
      .where('status', 'confirmed')
      .whereNull('deleted_at')

    if (transaction.calendarId) {
      query.where('calendar_id', transaction.calendarId)
    } else {
      query.whereNull('calendar_id')
    }

    if (transaction.conventionId) {
      query.where('convention_id', transaction.conventionId)
    } else {
      query.whereNull('convention_id')
    }

    if (transaction.principalExporterId) {
      query.where('principal_exporter_id', transaction.principalExporterId)
    } else {
      query.whereNull('principal_exporter_id')
    }

    return await query
  }

  /**
   * Trouver TOUTES les transactions complémentaires (pas seulement confirmées)
   * Utilisé pour vérifier si une transaction complémentaire a déjà été créée
   */
  async findAllComplementaryTransactions(transactionId: string): Promise<Transaction[]> {
    const transaction = await Transaction.findOrFail(transactionId)
    const oppositeType: TransactionType =
      transaction.transactionType === 'SALE' ? 'PURCHASE' : 'SALE'

    const query = Transaction.query()
      .where('id', '!=', transactionId)
      .where('seller_id', transaction.sellerId)
      .where('buyer_id', transaction.buyerId)
      .where('campaign_id', transaction.campaignId)
      .where('location_type', transaction.locationType)
      .where('transaction_type', oppositeType)
      .whereNull('deleted_at')

    // Contraintes spécifiques selon le locationType
    if (transaction.locationType === 'OUTSIDE_MARKET') {
      // OUTSIDE_MARKET: doit avoir la même date
      const isoDate = transaction.transactionDate.toISODate()
      if (isoDate) {
        query.whereRaw('DATE(transaction_date) = ?', [isoDate])
      }
    } else if (transaction.locationType === 'MARKET') {
      // MARKET: doit avoir le même calendar_id
      if (transaction.calendarId) {
        query.where('calendar_id', transaction.calendarId)
      } else {
        query.whereNull('calendar_id')
      }
    } else if (transaction.locationType === 'CONVENTION') {
      // CONVENTION: doit avoir le même calendar_id ET convention_id
      if (transaction.calendarId) {
        query.where('calendar_id', transaction.calendarId)
      } else {
        query.whereNull('calendar_id')
      }

      if (transaction.conventionId) {
        query.where('convention_id', transaction.conventionId)
      } else {
        query.whereNull('convention_id')
      }
    }

    // Gérer principal_exporter_id (pour tous les types)
    if (transaction.principalExporterId) {
      query.where('principal_exporter_id', transaction.principalExporterId)
    } else {
      query.whereNull('principal_exporter_id')
    }

    return await query
  }

  /**
   * Mettre à jour une transaction
   */
  async update(
    transactionId: string,
    data: UpdateTransactionData,
    userId: string
  ): Promise<Transaction> {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_UPDATE_NOT_FOUND,
        status: 404,
      })
    }

    // Vérifier que la transaction est en pending pour modifier les champs principaux
    if (
      (data.sellerId ||
        data.buyerId ||
        data.calendarId !== undefined ||
        data.conventionId !== undefined) &&
      transaction.status !== 'pending'
    ) {
      throw new Exception('Seule une transaction en attente peut être modifiée', {
        code: ErrorCodes.TRANSACTION_UPDATE_NOT_PENDING,
        status: 400,
      })
    }

    if (data.status) {
      transaction.status = data.status
    }

    if (data.notes !== undefined) {
      transaction.notes = data.notes || null
    }

    if (data.transactionDate) {
      transaction.transactionDate = DateTime.fromISO(data.transactionDate)
    }

    if (data.sellerId) {
      // Vérifier que le vendeur existe
      const seller = await Actor.find(data.sellerId)
      if (!seller) {
        throw new Exception('Vendeur non trouvé', {
          code: ErrorCodes.TRANSACTION_UPDATE_SELLER_NOT_FOUND,
          status: 400,
        })
      }
      transaction.sellerId = data.sellerId
    }

    if (data.buyerId) {
      // Vérifier que l'acheteur existe
      const buyer = await Actor.find(data.buyerId)
      if (!buyer) {
        throw new Exception('Acheteur non trouvé', {
          code: ErrorCodes.TRANSACTION_UPDATE_BUYER_NOT_FOUND,
          status: 400,
        })
      }
      transaction.buyerId = data.buyerId
    }

    if (data.calendarId !== undefined) {
      if (data.calendarId) {
        // Vérifier que le calendrier existe
        const calendar = await Calendar.find(data.calendarId)
        if (!calendar) {
          throw new Exception('Calendrier non trouvé', {
            code: ErrorCodes.TRANSACTION_UPDATE_CALENDAR_NOT_FOUND,
            status: 400,
          })
        }
      }
      transaction.calendarId = data.calendarId
    }

    if (data.conventionId !== undefined) {
      if (data.conventionId) {
        // Vérifier que la convention existe
        const convention = await Convention.find(data.conventionId)
        if (!convention) {
          throw new Exception('Convention non trouvée', {
            code: ErrorCodes.TRANSACTION_UPDATE_CONVENTION_NOT_FOUND,
            status: 400,
          })
        }
      }
      transaction.conventionId = data.conventionId
    }

    await transaction.save()

    // Audit log
    await AuditLog.create({
      auditableType: 'transaction',
      auditableId: transaction.id,
      action: 'update',
      newValues: {
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.transactionDate && { transactionDate: data.transactionDate }),
        ...(data.sellerId && { sellerId: data.sellerId }),
        ...(data.buyerId && { buyerId: data.buyerId }),
        ...(data.calendarId !== undefined && { calendarId: data.calendarId }),
        ...(data.conventionId !== undefined && { conventionId: data.conventionId }),
      },
      userId,
    })

    return transaction
  }

  /**
   * Supprimer une transaction (soft delete)
   */
  async delete(transactionId: string, userId: string): Promise<void> {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_DELETE_NOT_FOUND,
        status: 404,
      })
    }

    transaction.deletedAt = DateTime.now()
    await transaction.save()

    // Audit log
    await AuditLog.create({
      auditableType: 'transaction',
      auditableId: transaction.id,
      action: 'delete',
      userId,
    })
  }

  /**
   * Mettre à jour les produits d'une transaction
   */
  async updateProducts(
    transactionId: string,
    products: TransactionProductData[],
    userId: string
  ): Promise<Transaction> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .whereNull('deleted_at')
      .preload('seller')
      .first()

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND,
        status: 404,
      })
    }

    // Vérifier que la transaction est en pending
    if (transaction.status !== 'pending') {
      throw new Exception('Seule une transaction en attente peut avoir ses produits modifiés', {
        code: ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING,
        status: 400,
      })
    }

    // Si vendeur est OPA ET c'est une VENTE, vérifier que tous les produits ont un producer_id
    if (transaction.seller.actorType === 'PRODUCERS' && transaction.transactionType === 'SALE') {
      for (const product of products) {
        if (!product.producerId) {
          throw new Exception(
            'Un producteur doit être spécifié pour chaque produit quand le vendeur est une OPA',
            {
              code: ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA,
              status: 400,
            }
          )
        }

        // Vérifier que le producteur existe
        const producer = await Actor.find(product.producerId)
        if (!producer || producer.actorType !== 'PRODUCER') {
          throw new Exception('Producteur non trouvé', {
            code: ErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND,
            status: 400,
          })
        }
      }
    }

    const trx = await db.transaction()

    try {
      // Soft delete tous les produits existants
      await trx
        .from('transaction_products')
        .where('transaction_id', transactionId)
        .whereNull('deleted_at')
        .update({ deleted_at: DateTime.now().toISO() })

      // Créer les nouveaux produits
      for (const product of products) {
        await TransactionProduct.create(
          {
            transactionId: transaction.id,
            quality: product.quality,
            standard: product.standard,
            weight: product.weight,
            bagCount: product.bagCount,
            pricePerKg: product.pricePerKg,
            totalPrice: product.totalPrice,
            producerId: product.producerId || null,
            humidity: product.humidity || null,
            notes: product.notes || null,
          },
          { client: trx }
        )
      }

      // Audit log
      await AuditLog.create(
        {
          auditableType: 'transaction',
          auditableId: transaction.id,
          action: 'update_products',
          newValues: { productsCount: products.length },
          userId,
        },
        { client: trx }
      )

      await trx.commit()

      // Recharger avec les relations
      await transaction.load('products', (query) =>
        query.whereNull('deleted_at').preload('producer')
      )
      await transaction.load('seller')
      await transaction.load('buyer')
      await transaction.load('createdByActor')
      await transaction.load('campaign')
      await transaction.load('calendar')
      await transaction.load('convention')

      return transaction
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Obtenir une transaction par ID
   */
  async getById(transactionId: string): Promise<Transaction> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .whereNull('deleted_at')
      .preload('products', (query) => query.whereNull('deleted_at').preload('producer'))
      .preload('seller')
      .preload('buyer')
      .preload('principalExporter')
      .preload('createdByActor')
      .preload('campaign')
      .preload('calendar')
      .preload('convention')
      .first()

    if (!transaction) {
      throw new Exception('Transaction non trouvée', {
        code: ErrorCodes.TRANSACTION_NOT_FOUND,
        status: 404,
      })
    }

    return transaction
  }

  /**
   * Lister les transactions avec filtres et pagination
   */
  async list(
    filters: {
      page?: number
      limit?: number
      search?: string
      transactionType?: TransactionType
      locationType?: TransactionLocationType
      status?: string
      sellerId?: string
      buyerId?: string
      campaignId?: string
      calendarId?: string
      conventionId?: string
      startDate?: string
      endDate?: string
    },
    authUser: User
  ) {
    const page = filters.page || 1
    const limit = filters.limit || 20

    const query = Transaction.query().whereNull('deleted_at')
    let pendingComplementaryIds: string[] = []

    // Filtrage par rôle utilisateur
    if (authUser.role === 'basin_admin' || authUser.role === 'field_agent') {
      if (!authUser.productionBasinId) {
        throw new Exception("Votre compte n'est pas associé à un bassin de production", {
          code: ErrorCodes.SYSTEM_FORBIDDEN,
          status: 403,
        })
      }

      try {
        // Récupérer les locationCodes du bassin avec propagation hiérarchique
        const basinLocationCodes =
          await this.productionBasinService.getLocationCodesWithPropagation(
            authUser.productionBasinId
          )

        if (basinLocationCodes.length > 0) {
          // Filtrer les transactions où le vendeur OU l'acheteur respecte les critères
          query.where((builder) => {
            // Transactions où le vendeur est un OPA du bassin OU un autre type d'acteur
            builder.whereHas('seller', (actorQuery) => {
              actorQuery.where((subBuilder) => {
                // OPA de mon bassin (via location_code)
                subBuilder
                  .where('actor_type', 'PRODUCERS')
                  .whereIn('location_code', basinLocationCodes)
                // OU autre type d'acteur (TRANSFORMER, BUYER, EXPORTER)
                subBuilder.orWhereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
              })
            })

            // OU Transactions où l'acheteur est un OPA du bassin OU un autre type d'acteur
            builder.orWhereHas('buyer', (actorQuery) => {
              actorQuery.where((subBuilder) => {
                // OPA de mon bassin (via location_code)
                subBuilder
                  .where('actor_type', 'PRODUCERS')
                  .whereIn('location_code', basinLocationCodes)
                // OU autre type d'acteur (TRANSFORMER, BUYER, EXPORTER)
                subBuilder.orWhereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
              })
            })
          })
        } else {
          // Si le bassin n'a aucune location, retourner seulement les transactions
          // avec des acteurs non-PRODUCERS (TRANSFORMER, BUYER, EXPORTER)
          query.where((builder) => {
            builder.whereHas('seller', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
            builder.orWhereHas('buyer', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        }
      } catch (error) {
        // En cas d'erreur, retourner seulement les transactions avec acteurs non-PRODUCERS
        query.where((builder) => {
          builder.whereHas('seller', (actorQuery) => {
            actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
          })
          builder.orWhereHas('buyer', (actorQuery) => {
            actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
          })
        })
      }
    } else if (authUser.role === 'actor_manager') {
      // Actor manager voit :
      // 1. Toutes les transactions qu'il a créées (created_by_actor_id = actorId, tous statuts)
      // 2. Les transactions pendingComplementary de la campagne en cours où :
      //    - Il n'est PAS le créateur
      //    - Il est vendeur OU acheteur
      //    - La transaction est confirmée
      //    - Il n'existe pas de transaction complémentaire (type opposé) créée par lui
      if (!authUser.actorId) {
        throw new Exception("Votre compte n'est pas associé à un acteur", {
          code: ErrorCodes.SYSTEM_FORBIDDEN,
          status: 403,
        })
      }

      // Récupérer la campagne en cours
      const currentCampaign = await Campaign.query().where('status', 'active').first()

      if (!currentCampaign) {
        throw new Exception('Aucune campagne active trouvée', {
          code: ErrorCodes.SYSTEM_FORBIDDEN,
          status: 403,
        })
      }

      // Récupérer les transactions confirmées de la campagne en cours où :
      // - L'acteur n'est PAS le créateur
      // - L'acteur est vendeur OU acheteur
      const confirmedTransactionsNotCreatedByActor = await Transaction.query()
        .whereNull('deleted_at')
        .where('status', 'confirmed')
        .where('campaign_id', currentCampaign.id)
        .where((builder) => {
          builder.where('seller_id', authUser.actorId!)
          builder.orWhere('buyer_id', authUser.actorId!)
        })
        .where((builder) => {
          builder.whereNot('created_by_actor_id', authUser.actorId!)
          builder.orWhereNull('created_by_actor_id')
        })
        .select(
          'id',
          'seller_id',
          'buyer_id',
          'campaign_id',
          'location_type',
          'transaction_type',
          'calendar_id',
          'convention_id',
          'principal_exporter_id',
          'transaction_date'
        )

      for (const transaction of confirmedTransactionsNotCreatedByActor) {
        const oppositeType: TransactionType =
          transaction.transactionType === 'SALE' ? 'PURCHASE' : 'SALE'

        // Chercher une transaction complémentaire CRÉÉE PAR L'ACTEUR (peu importe le statut)
        const complementaryQuery = Transaction.query()
          .whereNull('deleted_at')
          .where('created_by_actor_id', authUser.actorId!)
          .where('seller_id', transaction.sellerId)
          .where('buyer_id', transaction.buyerId)
          .where('campaign_id', transaction.campaignId)
          .where('location_type', transaction.locationType)
          .where('transaction_type', oppositeType)

        // Contraintes spécifiques selon le locationType
        if (transaction.locationType === 'OUTSIDE_MARKET') {
          // OUTSIDE_MARKET: doit avoir la même date
          const isoDate = transaction.transactionDate.toISODate()
          if (isoDate) {
            complementaryQuery.whereRaw('DATE(transaction_date) = ?', [isoDate])
          }
        } else if (transaction.locationType === 'MARKET') {
          // MARKET: doit avoir le même calendar_id
          if (transaction.calendarId) {
            complementaryQuery.where('calendar_id', transaction.calendarId)
          } else {
            complementaryQuery.whereNull('calendar_id')
          }
        } else if (transaction.locationType === 'CONVENTION') {
          // CONVENTION: doit avoir le même calendar_id ET convention_id
          if (transaction.calendarId) {
            complementaryQuery.where('calendar_id', transaction.calendarId)
          } else {
            complementaryQuery.whereNull('calendar_id')
          }

          if (transaction.conventionId) {
            complementaryQuery.where('convention_id', transaction.conventionId)
          } else {
            complementaryQuery.whereNull('convention_id')
          }
        }

        // Gérer principal_exporter_id (pour tous les types)
        if (transaction.principalExporterId) {
          complementaryQuery.where('principal_exporter_id', transaction.principalExporterId)
        } else {
          complementaryQuery.whereNull('principal_exporter_id')
        }

        const hasComplementary = await complementaryQuery.first()

        // Si pas de complémentaire créée par l'acteur, ajouter à la liste
        if (!hasComplementary) {
          pendingComplementaryIds.push(transaction.id)
        }
      }

      // Filtrer : transactions créées par l'acteur OU transactions pendingComplementary
      query.where((builder) => {
        // Toutes ses transactions créées (tous statuts)
        builder.where('created_by_actor_id', authUser.actorId!)

        // OU transactions pendingComplementary
        if (pendingComplementaryIds.length > 0) {
          builder.orWhereIn('id', pendingComplementaryIds)
        }
      })
    }
    // Les technical_admin voient toutes les transactions (pas de filtre supplémentaire)

    // Recherche par code de transaction ou identifiants des acteurs
    if (filters.search) {
      query.where((builder) => {
        builder
          .whereILike('code', `%${filters.search}%`)
          .orWhereHas('seller', (actorQuery) => {
            actorQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
          .orWhereHas('buyer', (actorQuery) => {
            actorQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
      })
    }

    if (filters.transactionType) {
      query.where('transaction_type', filters.transactionType)
    }

    if (filters.locationType) {
      query.where('location_type', filters.locationType)
    }

    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.sellerId) {
      query.where('seller_id', filters.sellerId)
    }

    if (filters.buyerId) {
      query.where('buyer_id', filters.buyerId)
    }

    if (filters.campaignId) {
      query.where('campaign_id', filters.campaignId)
    }

    if (filters.calendarId) {
      query.where('calendar_id', filters.calendarId)
    }

    if (filters.conventionId) {
      query.where('convention_id', filters.conventionId)
    }

    if (filters.startDate) {
      query.where('transaction_date', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query.where('transaction_date', '<=', filters.endDate)
    }

    const transactions = await query
      .preload('products', (productsQuery) => productsQuery.whereNull('deleted_at'))
      .preload('seller')
      .preload('buyer')
      .preload('createdByActor')
      .preload('campaign')
      .preload('calendar')
      .preload('convention')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    // Pour actor_manager, retourner aussi les IDs des transactions pendingComplementary
    if (authUser.role === 'actor_manager') {
      // Filtrer les pendingComplementaryIds pour ne garder que ceux des transactions retournées
      const returnedIds = transactions.all().map((t) => t.id)
      const finalPendingIds = pendingComplementaryIds.filter((id: string) =>
        returnedIds.includes(id)
      )

      return { transactions, pendingComplementaryIds: finalPendingIds }
    }

    return { transactions, pendingComplementaryIds: [] }
  }
}
