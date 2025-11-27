import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import type { ConventionProduct } from '#models/convention'
import Convention from '#models/convention'
import ProductionBasinService from '#services/production_basin_service'
import { ConventionErrorCodes } from '#types/errors/convention'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export interface CreateConventionData {
  buyerExporterId: string
  producersId: string
  signatureDate: DateTime
  products: ConventionProduct[]
}

export interface UpdateConventionData {
  buyerExporterId?: string
  producersId?: string
  signatureDate?: DateTime
  products?: ConventionProduct[]
}

@inject()
export default class ConventionService {
  constructor(protected productionBasinService: ProductionBasinService) {}

  /**
   * Générer un code unique pour une convention
   * Format: CONV-{YEAR}-{SEQUENCE}
   * Où YEAR est l'année de la date de signature
   */
  private async generateConventionCode(signatureDate: DateTime, trx: any): Promise<string> {
    const year = signatureDate.year
    const prefix = `CONV-${year}-`

    // Trouver le dernier code pour cette année
    const lastConvention = await Convention.query({ client: trx })
      .where('code', 'like', `${prefix}%`)
      .orderByRaw('CAST(SUBSTRING(code FROM 11) AS INTEGER) DESC')
      .first()

    let nextSequence = 1
    if (lastConvention) {
      // Extraire le numéro de séquence du dernier code
      const lastSequenceStr = lastConvention.code.replace(prefix, '')
      const lastSequence = Number.parseInt(lastSequenceStr, 10)
      if (!Number.isNaN(lastSequence)) {
        nextSequence = lastSequence + 1
      }
    }

    // Formater avec 4 chiffres (0001, 0002, etc.)
    const sequenceStr = nextSequence.toString().padStart(4, '0')
    return `${prefix}${sequenceStr}`
  }

  /**
   * Récupérer la campagne active
   */
  async getActiveCampaign(): Promise<Campaign | null> {
    return await Campaign.getActiveCampaign()
  }

  /**
   * Créer une nouvelle convention avec audit log
   */
  async create(
    data: CreateConventionData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Convention> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'acheteur/exportateur existe et a le bon type
      const buyerExporter = await Actor.query({ client: trx })
        .where('id', data.buyerExporterId)
        .whereNull('deleted_at')
        .first()

      if (!buyerExporter) {
        throw new Exception("L'acheteur/exportateur n'existe pas", {
          code: ConventionErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_FOUND,
          status: 404,
        })
      }

      if (buyerExporter.actorType !== 'BUYER' && buyerExporter.actorType !== 'EXPORTER') {
        throw new Exception("L'acteur sélectionné n'est pas un acheteur ou exportateur", {
          code: ConventionErrorCodes.CONVENTION_INVALID_BUYER_EXPORTER_TYPE,
          status: 400,
        })
      }

      // Vérifier que l'acheteur/exportateur est actif
      if (buyerExporter.status !== 'active') {
        throw new Exception("L'acheteur/exportateur sélectionné n'est pas actif", {
          code: ConventionErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_ACTIVE,
          status: 400,
        })
      }

      // Vérifier que l'acteur producers existe
      const producers = await Actor.query({ client: trx })
        .where('id', data.producersId)
        .whereNull('deleted_at')
        .first()

      if (!producers) {
        throw new Exception("L'OPA n'existe pas", {
          code: ConventionErrorCodes.CONVENTION_OPA_NOT_FOUND,
          status: 404,
        })
      }

      // Vérifier que l'OPA est active
      if (producers.status !== 'active') {
        throw new Exception("L'OPA sélectionnée n'est pas active", {
          code: ConventionErrorCodes.CONVENTION_OPA_NOT_ACTIVE,
          status: 400,
        })
      }

      // Vérifier qu'il y a au moins un produit
      if (!data.products || data.products.length === 0) {
        throw new Exception('Au moins un produit doit être spécifié', {
          code: ConventionErrorCodes.CONVENTION_NO_PRODUCTS,
          status: 400,
        })
      }

      // Générer le code unique de la convention
      const code = await this.generateConventionCode(data.signatureDate, trx)

      // Créer la convention
      const convention = new Convention()
      convention.useTransaction(trx)
      convention.code = code
      convention.buyerExporterId = data.buyerExporterId
      convention.producersId = data.producersId
      convention.signatureDate = data.signatureDate
      convention.products = data.products

      await convention.save()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'convention',
            auditableId: convention.id,
            action: 'create',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues: {
              code: convention.code,
              buyerExporterId: convention.buyerExporterId,
              producersId: convention.producersId,
              signatureDate: convention.signatureDate.toISODate(),
              products: convention.products as any,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          // Silently fail - audit log is not critical
        }
      }

      return convention
    })
  }

  /**
   * Mettre à jour une convention avec audit log
   */
  async update(
    id: string,
    data: UpdateConventionData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Convention> {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .firstOrFail()

      // Sauvegarder les valeurs originales pour l'audit log
      const originalValues = {
        buyerExporterId: convention.buyerExporterId,
        producersId: convention.producersId,
        signatureDate: convention.signatureDate.toISODate(),
        products: convention.products,
      }

      // Vérifier l'acheteur/exportateur si modifié
      if (data.buyerExporterId && data.buyerExporterId !== convention.buyerExporterId) {
        const buyerExporter = await Actor.query({ client: trx })
          .where('id', data.buyerExporterId)
          .whereNull('deleted_at')
          .first()

        if (!buyerExporter) {
          throw new Exception("L'acheteur/exportateur n'existe pas", {
            code: 'CONVENTION_BUYER_EXPORTER_NOT_FOUND',
            status: 404,
          })
        }

        if (buyerExporter.actorType !== 'BUYER' && buyerExporter.actorType !== 'EXPORTER') {
          throw new Exception("L'acteur sélectionné n'est pas un acheteur ou exportateur", {
            code: 'CONVENTION_INVALID_BUYER_EXPORTER_TYPE',
            status: 400,
          })
        }
      }

      // Vérifier l'acteur producers si modifié
      if (data.producersId && data.producersId !== convention.producersId) {
        const producers = await Actor.query({ client: trx })
          .where('id', data.producersId)
          .whereNull('deleted_at')
          .first()

        if (!producers) {
          throw new Exception("L'acteur producteurs n'existe pas", {
            code: 'CONVENTION_PRODUCERS_NOT_FOUND',
            status: 404,
          })
        }
      }

      // Vérifier les produits si modifiés
      if (data.products && data.products.length === 0) {
        throw new Exception('Au moins un produit doit être spécifié', {
          code: 'CONVENTION_NO_PRODUCTS',
          status: 400,
        })
      }

      // Déterminer les champs modifiés et mettre à jour
      const changedFields: Record<string, any> = {}

      if (data.buyerExporterId && data.buyerExporterId !== convention.buyerExporterId) {
        convention.buyerExporterId = data.buyerExporterId
        changedFields.buyerExporterId = data.buyerExporterId
      }

      if (data.producersId && data.producersId !== convention.producersId) {
        convention.producersId = data.producersId
        changedFields.producersId = data.producersId
      }

      if (
        data.signatureDate &&
        data.signatureDate.toISODate() !== convention.signatureDate.toISODate()
      ) {
        convention.signatureDate = data.signatureDate
        changedFields.signatureDate = data.signatureDate.toISODate()
      }

      if (data.products && JSON.stringify(data.products) !== JSON.stringify(convention.products)) {
        convention.products = data.products
        changedFields.products = data.products as any
      }

      // Sauvegarder seulement s'il y a des modifications
      if (Object.keys(changedFields).length > 0) {
        await convention.save()

        // Créer l'audit log si le contexte est fourni
        if (auditContext) {
          try {
            const oldValues = Object.keys(changedFields).reduce(
              (acc, field) => {
                acc[field] = (originalValues as any)[field] || null
                return acc
              },
              {} as Record<string, any>
            )

            await AuditLog.logAction({
              auditableType: 'convention',
              auditableId: convention.id,
              action: 'update',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues,
              newValues: changedFields,
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })
          } catch (auditError) {
            // Silently fail - audit log is not critical
          }
        }
      }

      return convention
    })
  }

  /**
   * Associer une convention à une campagne
   */
  async associateCampaign(
    conventionId: string,
    campaignId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Convention> {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', conventionId)
        .whereNull('deleted_at')
        .firstOrFail()

      const campaign = await Campaign.query({ client: trx }).where('id', campaignId).firstOrFail()

      // Vérifier si la relation existe déjà
      const existing = await trx
        .from('convention_campaign')
        .where('convention_id', conventionId)
        .where('campaign_id', campaignId)
        .first()

      if (!existing) {
        // Créer la nouvelle association
        await trx.table('convention_campaign').insert({
          convention_id: conventionId,
          campaign_id: campaignId,
          created_at: DateTime.now().toSQL(),
        })

        // Mettre à jour le updated_at de la convention pour déclencher la sync incrémentale
        convention.updatedAt = DateTime.now()
        await convention.save()

        // Créer l'audit log si le contexte est fourni
        if (auditContext) {
          try {
            await AuditLog.logAction({
              auditableType: 'convention',
              auditableId: convention.id,
              action: 'associate_campaign',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues: null,
              newValues: { campaignId, campaignCode: campaign.code },
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })
          } catch (auditError) {
            // Silently fail - audit log is not critical
          }
        }
      }

      return convention
    })
  }

  /**
   * Dissocier une convention d'une campagne
   */
  async dissociateCampaign(
    conventionId: string,
    campaignId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Convention> {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', conventionId)
        .whereNull('deleted_at')
        .firstOrFail()

      const campaign = await Campaign.query({ client: trx }).where('id', campaignId).firstOrFail()

      // Vérifier si la relation existe
      const existing = await trx
        .from('convention_campaign')
        .where('convention_id', conventionId)
        .where('campaign_id', campaignId)
        .first()

      if (!existing) {
        throw new Exception("Cette convention n'est pas associée à cette campagne", {
          code: 'CONVENTION_CAMPAIGN_NOT_ASSOCIATED',
          status: 400,
        })
      }

      // Supprimer l'association
      await trx
        .from('convention_campaign')
        .where('convention_id', conventionId)
        .where('campaign_id', campaignId)
        .delete()

      // Mettre à jour le updated_at de la convention pour déclencher la sync incrémentale
      convention.updatedAt = DateTime.now()
      await convention.save()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'convention',
            auditableId: convention.id,
            action: 'dissociate_campaign',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: { campaignId, campaignCode: campaign.code },
            newValues: null,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          // Silently fail - audit log is not critical
        }
      }

      return convention
    })
  }

  /**
   * Lister toutes les conventions avec pagination et filtres
   */
  async list(
    page: number = 1,
    limit: number = 20,
    filters?: {
      buyerExporterId?: string
      producersId?: string
      campaignId?: string
      search?: string
    },
    user?: { id: string; role: string; productionBasinId?: string; actorId?: string }
  ) {
    const query = Convention.query()
      .whereNull('deleted_at')
      .preload('buyerExporter')
      .preload('producers')
      .preload('campaigns')
      .orderBy('created_at', 'desc')

    // Filtrage par rôle utilisateur
    if (user) {
      if (user.role === 'basin_admin' || user.role === 'field_agent') {
        // Conventions des OPA de leur bassin de production uniquement
        if (user.productionBasinId) {
          try {
            // Récupérer les locationCodes du bassin avec propagation hiérarchique
            const basinLocationCodes =
              await this.productionBasinService.getLocationCodesWithPropagation(
                user.productionBasinId
              )

            if (basinLocationCodes.length > 0) {
              // Filtrer les conventions dont le producteur (OPA) est dans le bassin
              query.whereHas('producers', (producerQuery) => {
                producerQuery.whereIn('location_code', basinLocationCodes)
              })
            } else {
              // Si le bassin n'a aucune location, ne retourner aucun résultat
              query.whereRaw('1 = 0')
            }
          } catch (error) {
            // En cas d'erreur, ne retourner aucun résultat
            query.whereRaw('1 = 0')
          }
        }
      } else if (user.role === 'actor_manager') {
        // Actor Manager: filtrer selon le type d'acteur
        if (user.actorId) {
          // Récupérer l'acteur pour vérifier son type
          const actor = await Actor.find(user.actorId)

          if (actor) {
            if (actor.actorType === 'PRODUCERS') {
              // OPA: uniquement leurs propres conventions
              query.where('producers_id', user.actorId)
            } else if (actor.actorType === 'BUYER' || actor.actorType === 'EXPORTER') {
              // Acheteur/Exporteur: conventions où ils sont notifiés
              query.where('buyer_exporter_id', user.actorId)
            }
          }
        }
      }
      // Pour les autres rôles (admin, etc.), pas de filtrage spécifique
    }

    // Appliquer les filtres supplémentaires
    if (filters?.buyerExporterId) {
      query.where('buyer_exporter_id', filters.buyerExporterId)
    }

    if (filters?.producersId) {
      query.where('producers_id', filters.producersId)
    }

    if (filters?.campaignId) {
      query.whereHas('campaigns', (campaignsQuery) => {
        campaignsQuery.where('campaigns.id', filters.campaignId!)
      })
    }

    if (filters?.search) {
      query.where((builder) => {
        builder
          .whereILike('code', `%${filters.search}%`)
          .orWhereHas('buyerExporter', (buyerQuery) => {
            buyerQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
          .orWhereHas('producers', (producerQuery) => {
            producerQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
      })
    }

    return await query.paginate(page, limit)
  }

  /**
   * Récupérer une convention par son ID
   */
  async findById(id: string): Promise<Convention> {
    return await Convention.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('buyerExporter')
      .preload('producers')
      .preload('campaigns')
      .firstOrFail()
  }

  /**
   * Supprimer (soft delete) une convention
   */
  async delete(
    id: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .firstOrFail()

      convention.deletedAt = DateTime.now()
      await convention.save()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'convention',
            auditableId: convention.id,
            action: 'delete',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: {
              buyerExporterId: convention.buyerExporterId,
              producersId: convention.producersId,
            },
            newValues: null,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          // Silently fail - audit log is not critical
        }
      }
    })
  }

  /**
   * Récupérer toutes les conventions pour la synchronisation initiale
   * Utilisé par le frontend lors de la sync initiale offline
   * Filtre selon le rôle de l'utilisateur et la campagne active
   */
  async getAllForSync(options: {
    userRole: string
    userProductionBasinId?: string
    userActorId?: string
  }): Promise<Convention[]> {
    const query = Convention.query()
      .whereNull('deleted_at')
      .preload('buyerExporter', (buyerQuery) => {
        buyerQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .preload('producers', (producersQuery) => {
        producersQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .preload('campaigns', (campaignsQuery) => {
        campaignsQuery.select(['id', 'code', 'start_date', 'end_date', 'status'])
      })
      .orderBy('updated_at', 'desc')

    // Filtrage par rôle utilisateur (même logique que list())
    if (options.userRole === 'basin_admin' || options.userRole === 'field_agent') {
      // Conventions des OPA de leur bassin de production uniquement
      if (options.userProductionBasinId) {
        try {
          const basinLocationCodes =
            await this.productionBasinService.getLocationCodesWithPropagation(
              options.userProductionBasinId
            )

          if (basinLocationCodes.length > 0) {
            query.whereHas('producers', (producerQuery) => {
              producerQuery.whereIn('location_code', basinLocationCodes)
            })
          } else {
            return []
          }
        } catch (error) {
          return []
        }
      }
    } else if (options.userRole === 'actor_manager') {
      // Actor Manager: filtrer selon le type d'acteur
      if (options.userActorId) {
        const actor = await Actor.find(options.userActorId)

        if (actor) {
          if (actor.actorType === 'PRODUCERS') {
            // OPA: uniquement leurs propres conventions
            query.where('producers_id', options.userActorId)
          } else if (actor.actorType === 'BUYER' || actor.actorType === 'EXPORTER') {
            // Acheteur/Exporteur: conventions où ils sont notifiés
            query.where('buyer_exporter_id', options.userActorId)
          }
        }
      }
    }
    // Pour les autres rôles (admin, etc.), retourner toutes les conventions de la campagne active

    return await query
  }

  /**
   * Récupérer les conventions modifiées depuis une date donnée
   * Utilisé par le frontend lors de la sync incrémentale offline
   * Filtre selon le rôle de l'utilisateur et la campagne active
   */
  async getUpdatedSince(options: {
    since: Date
    userRole: string
    userProductionBasinId?: string
    userActorId?: string
  }): Promise<Convention[]> {
    const query = Convention.query()
      .whereNull('deleted_at')
      .where('updated_at', '>', options.since.toISOString())
      .preload('buyerExporter', (buyerQuery) => {
        buyerQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .preload('producers', (producersQuery) => {
        producersQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .preload('campaigns', (campaignsQuery) => {
        campaignsQuery.select(['id', 'code', 'start_date', 'end_date', 'status'])
      })
      .orderBy('updated_at', 'desc')

    // Filtrage par rôle utilisateur (même logique que getAllForSync())
    if (options.userRole === 'basin_admin' || options.userRole === 'field_agent') {
      if (options.userProductionBasinId) {
        try {
          const basinLocationCodes =
            await this.productionBasinService.getLocationCodesWithPropagation(
              options.userProductionBasinId
            )

          if (basinLocationCodes.length > 0) {
            query.whereHas('producers', (producerQuery) => {
              producerQuery.whereIn('location_code', basinLocationCodes)
            })
          } else {
            return []
          }
        } catch (error) {
          return []
        }
      }
    } else if (options.userRole === 'actor_manager') {
      if (options.userActorId) {
        const actor = await Actor.find(options.userActorId)

        if (actor) {
          if (actor.actorType === 'PRODUCERS') {
            query.where('producers_id', options.userActorId)
          } else if (actor.actorType === 'BUYER' || actor.actorType === 'EXPORTER') {
            query.where('buyer_exporter_id', options.userActorId)
          }
        }
      }
    }

    return await query
  }
}
