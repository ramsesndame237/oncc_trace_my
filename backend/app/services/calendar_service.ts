import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Calendar from '#models/calendar'
import Campaign from '#models/campaign'
import Convention from '#models/convention'
import ProductionBasinService from '#services/production_basin_service'
import type {
  CalendarFilters,
  CalendarStatus,
  CreateCalendarData,
  UpdateCalendarData,
} from '#types/calendar_types'
import { CalendarErrorCodes } from '#types/errors/calendar'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

@inject()
export default class CalendarService {
  constructor(protected productionBasinService: ProductionBasinService) {}
  /**
   * Génère un code unique pour un nouveau calendrier
   * Format: MAR-YYYY-XXXXX (pour MARCHE) ou ENL-YYYY-XXXXX (pour ENLEVEMENT)
   * @param calendarType Type de calendrier (MARCHE ou ENLEVEMENT)
   * @returns Le code généré
   */
  private async generateUniqueCode(calendarType: string): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = calendarType === 'ENLEVEMENT' ? 'ENL' : 'MAR'

    // Trouver le dernier code généré cette année pour ce type
    const lastCalendar = await Calendar.query()
      .where('code', 'like', `${prefix}-${currentYear}-%`)
      .orderBy('code', 'desc')
      .first()

    let nextNumber = 1

    if (lastCalendar?.code) {
      // Extraire le numéro séquentiel du dernier code
      const lastNumber = Number.parseInt(lastCalendar.code.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }

    // Générer le nouveau code avec padding à 5 chiffres
    const paddedNumber = nextNumber.toString().padStart(5, '0')
    const newCode = `${prefix}-${currentYear}-${paddedNumber}`

    // Vérifier l'unicité (sécurité supplémentaire)
    const existingCalendar = await Calendar.findBy('code', newCode)
    if (existingCalendar) {
      // Si par hasard le code existe déjà, essayer le suivant (récursif)
      return this.generateUniqueCode(calendarType)
    }

    return newCode
  }

  /**
   * Créer un nouveau calendrier avec audit log
   */
  async create(
    data: CreateCalendarData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Calendar> {
    return await db.transaction(async (trx) => {
      // Générer le code automatiquement si non fourni
      const code = data.code || (await this.generateUniqueCode(data.type))

      // Déterminer la campagne à utiliser
      let campaignId = data.campaignId

      if (!campaignId) {
        // Si campaignId n'est pas fourni, utiliser la campagne active
        const activeCampaign = await Campaign.query({ client: trx })
          .where('status', 'active')
          .first()

        if (!activeCampaign) {
          throw new Exception('Campagne non trouvée', {
            code: CalendarErrorCodes.CAMPAIGN_NOT_FOUND,
            status: 400,
          })
        }

        campaignId = activeCampaign.id
      } else {
        // Vérifier que la campagne existe
        const campaign = await Campaign.query({ client: trx }).where('id', campaignId).first()
        if (!campaign) {
          throw new Exception('Campagne non trouvée', {
            code: CalendarErrorCodes.CAMPAIGN_NOT_FOUND,
            status: 400,
          })
        }
      }

      // Vérifier que la convention existe si c'est un ENLEVEMENT
      if (data.type === 'ENLEVEMENT') {
        if (!data.conventionId) {
          throw new Exception('La convention est requise pour un calendrier de type ENLEVEMENT', {
            code: CalendarErrorCodes.CONVENTION_REQUIRED,
            status: 400,
          })
        }
        const convention = await Convention.query({ client: trx })
          .where('id', data.conventionId)
          .first()
        if (!convention) {
          throw new Exception('Convention non trouvée', {
            code: CalendarErrorCodes.CONVENTION_NOT_FOUND,
            status: 400,
          })
        }
      }

      // Vérifier que le code n'existe pas déjà (si fourni manuellement)
      if (data.code) {
        const existingCalendar = await Calendar.query({ client: trx })
          .where('code', data.code)
          .whereNull('deleted_at')
          .first()
        if (existingCalendar) {
          throw new Exception('Ce code de calendrier existe déjà', {
            code: CalendarErrorCodes.CODE_EXISTS,
            status: 400,
          })
        }
      }

      // Vérifier que la date de fin est après la date de début
      if (data.endDate <= data.startDate) {
        throw new Exception('La date de fin doit être après la date de début', {
          code: CalendarErrorCodes.INVALID_DATE_RANGE,
          status: 400,
        })
      }

      // Vérifier que l'OPA existe et est actif
      if (data.opaId) {
        const opa = await Actor.query({ client: trx })
          .where('id', data.opaId)
          .whereIn('actor_type', ['PRODUCERS'])
          .whereNull('deleted_at')
          .first()

        if (!opa) {
          throw new Exception('OPA non trouvé', {
            code: CalendarErrorCodes.OPA_NOT_FOUND,
            status: 400,
          })
        }

        // Vérifier que l'OPA est actif
        if (opa.status !== 'active') {
          throw new Exception("L'OPA sélectionné n'est pas actif", {
            code: CalendarErrorCodes.OPA_NOT_ACTIVE,
            status: 400,
          })
        }
      }

      // Créer le calendrier
      const calendar = await Calendar.create(
        {
          code: code,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          eventTime: data.eventTime,
          locationCode: data.locationCode,
          location: data.location,
          campaignId: campaignId,
          conventionId: data.conventionId,
          opaId: data.opaId,
          expectedSalesCount: data.expectedSalesCount,
          status: data.status || 'active',
        },
        { client: trx }
      )

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'calendar',
            auditableId: calendar.id,
            action: 'create',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues: {
              code: calendar.code,
              type: calendar.type,
              startDate: calendar.startDate.toISODate(),
              endDate: calendar.endDate.toISODate(),
              campaignId: calendar.campaignId,
              expectedSalesCount: calendar.expectedSalesCount,
              status: calendar.status,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de la création du log d'audit:", auditError)
        }
      }

      return calendar
    })
  }

  /**
   * Récupérer la liste des calendriers avec pagination et filtres
   * Filtrage par rôle:
   * - BASIN_ADMIN / FIELD_AGENT: Uniquement les calendriers des OPA de leur bassin
   * - PRODUCERS: Uniquement leurs propres calendriers (liés à leur acteur)
   * - Autres: Tous les calendriers
   */
  async list(
    filters: CalendarFilters = {},
    user?: { id: string; role: string; productionBasinId?: string; actorId?: string }
  ) {
    const { page = 1, perPage = 20 } = filters

    const query = Calendar.query()
      .whereNull('deleted_at')
      .preload('campaign')
      .preload('convention')
      .preload('locationRelation')
      .preload('opa')

    // Exclure les calendriers terminés (date de fin < aujourd'hui)
    const today = DateTime.now().toSQLDate()
    query.where('end_date', '>=', today || '')

    // Tri du plus ancien au plus récent
    query.orderBy('start_date', 'asc')

    // Filtrage par rôle utilisateur
    if (user) {
      if (user.role === 'basin_admin' || user.role === 'field_agent') {
        // Calendriers des OPA de leur bassin de production uniquement
        if (user.productionBasinId) {
          try {
            // Récupérer les locationCodes du bassin avec propagation hiérarchique
            const basinLocationCodes =
              await this.productionBasinService.getLocationCodesWithPropagation(
                user.productionBasinId
              )

            if (basinLocationCodes.length > 0) {
              // Pour les calendriers, filtrer par le locationCode de l'OPA
              query.whereHas('opa', (opaQuery) => {
                opaQuery.whereIn('location_code', basinLocationCodes)
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
        // Actor Manager: uniquement si c'est un OPA (PRODUCERS)
        if (user.actorId) {
          // Récupérer l'acteur pour vérifier son type
          const actor = await Actor.find(user.actorId)

          if (actor && actor.actorType === 'PRODUCERS') {
            // OPA: uniquement leurs propres calendriers
            query.where('opa_id', user.actorId)
          } else if (actor && ['BUYER', 'EXPORTER'].includes(actor.actorType)) {
            // BUYER/EXPORTER: voir tous les MARCHE + ENLEVEMENT liés à leurs conventions
            // Récupérer la campagne active
            const activeCampaign = await Campaign.query().where('status', 'active').first()

            query.where((subQuery) => {
              // Voir tous les calendriers de type MARCHE
              subQuery.where('type', 'MARCHE')
              // OU voir les calendriers ENLEVEMENT liés aux conventions associées à la campagne active où ils sont associés
              if (activeCampaign) {
                subQuery.orWhere((enlevementQuery) => {
                  enlevementQuery
                    .where('type', 'ENLEVEMENT')
                    .whereHas('convention', (conventionQuery) => {
                      conventionQuery
                        .where('buyer_exporter_id', user.actorId!)
                        .whereHas('campaigns', (campaignQuery) => {
                          campaignQuery.where('campaigns.id', activeCampaign.id)
                        })
                    })
                })
              }
            })
          }
        }
      }
      // Pour les autres rôles (admin, etc.), pas de filtrage spécifique
    }

    // Recherche par code de calendrier ou identifiants de l'OPA
    if (filters.search) {
      query.where((builder) => {
        builder.whereILike('code', `%${filters.search}%`).orWhereHas('opa', (actorQuery) => {
          actorQuery
            .whereILike('family_name', `%${filters.search}%`)
            .orWhereILike('given_name', `%${filters.search}%`)
            .orWhereILike('oncc_id', `%${filters.search}%`)
        })
      })
    }

    // Appliquer les filtres
    if (filters.code) {
      query.whereILike('code', `%${filters.code}%`)
    }
    if (filters.type) {
      query.where('type', filters.type)
    }
    if (filters.status) {
      query.where('status', filters.status)
    }
    if (filters.campaignId) {
      query.where('campaign_id', filters.campaignId)
    }
    if (filters.conventionId) {
      query.where('convention_id', filters.conventionId)
    }
    if (filters.locationCode) {
      query.whereILike('location_code', `%${filters.locationCode}%`)
    }
    if (filters.location) {
      query.whereILike('location', `%${filters.location}%`)
    }
    if (filters.startDate) {
      query.where('start_date', '>=', filters.startDate.toSQLDate() || '')
    }
    if (filters.endDate) {
      query.where('end_date', '<=', filters.endDate.toSQLDate() || '')
    }

    return await query.paginate(page, perPage)
  }

  /**
   * Récupérer un calendrier par son ID
   */
  async show(id: string): Promise<Calendar> {
    const calendar = await Calendar.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('campaign')
      .preload('convention')
      .preload('locationRelation')
      .preload('opa')
      .first()

    if (!calendar) {
      throw new Exception('Calendrier non trouvé', {
        code: CalendarErrorCodes.NOT_FOUND,
        status: 404,
      })
    }

    return calendar
  }

  /**
   * Mettre à jour un calendrier avec audit log
   */
  async update(
    id: string,
    data: UpdateCalendarData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Calendar> {
    return await db.transaction(async (trx) => {
      // Récupérer le calendrier
      const calendar = await Calendar.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .first()

      if (!calendar) {
        throw new Exception('Calendrier non trouvé', {
          code: CalendarErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      // Vérifier que la campagne existe si elle est modifiée
      if (data.campaignId) {
        const campaign = await Campaign.query({ client: trx }).where('id', data.campaignId).first()
        if (!campaign) {
          throw new Exception('Campagne non trouvée', {
            code: CalendarErrorCodes.CAMPAIGN_NOT_FOUND,
            status: 400,
          })
        }
      }

      // Vérifier que l'OPA existe si elle est modifiée
      if (data.opaId) {
        const opa = await Actor.query({ client: trx })
          .where('id', data.opaId)
          .whereIn('actor_type', ['PRODUCERS'])
          .first()
        if (!opa) {
          throw new Exception('OPA non trouvé', {
            code: CalendarErrorCodes.OPA_NOT_FOUND,
            status: 400,
          })
        }
      }

      // Vérifier que la convention existe si elle est modifiée et que c'est un ENLEVEMENT
      const newType = data.type || calendar.type
      if (newType === 'ENLEVEMENT' && data.conventionId) {
        const convention = await Convention.query({ client: trx })
          .where('id', data.conventionId)
          .first()
        if (!convention) {
          throw new Exception('Convention non trouvée', {
            code: CalendarErrorCodes.CONVENTION_NOT_FOUND,
            status: 400,
          })
        }
      }

      // Vérifier que la date de fin est après la date de début
      const newStartDate = data.startDate || calendar.startDate
      const newEndDate = data.endDate || calendar.endDate
      if (newEndDate <= newStartDate) {
        throw new Exception('La date de fin doit être après la date de début', {
          code: CalendarErrorCodes.INVALID_DATE_RANGE,
          status: 400,
        })
      }

      // Capturer les anciennes valeurs avant la modification
      const oldValues: Record<string, any> = {}
      const newValues: Record<string, any> = {}
      const changedFields: string[] = []

      // Vérifier quels champs ont été modifiés
      if (data.startDate !== undefined) {
        const oldDate = calendar.startDate.toISODate()
        const newDate = data.startDate.toISODate()
        if (oldDate !== newDate) {
          oldValues.startDate = oldDate
          newValues.startDate = newDate
          changedFields.push('startDate')
        }
      }
      if (data.endDate !== undefined) {
        const oldDate = calendar.endDate.toISODate()
        const newDate = data.endDate.toISODate()
        if (oldDate !== newDate) {
          oldValues.endDate = oldDate
          newValues.endDate = newDate
          changedFields.push('endDate')
        }
      }
      if (data.eventTime !== undefined && data.eventTime !== calendar.eventTime) {
        oldValues.eventTime = calendar.eventTime
        newValues.eventTime = data.eventTime
        changedFields.push('eventTime')
      }
      if (data.locationCode !== undefined && data.locationCode !== calendar.locationCode) {
        oldValues.locationCode = calendar.locationCode
        newValues.locationCode = data.locationCode
        changedFields.push('locationCode')
      }
      if (data.location !== undefined && data.location !== calendar.location) {
        oldValues.location = calendar.location
        newValues.location = data.location
        changedFields.push('location')
      }
      if (data.conventionId !== undefined && data.conventionId !== calendar.conventionId) {
        // Récupérer les informations des conventions pour l'audit
        let oldConventionInfo = null
        let newConventionInfo = null

        if (calendar.conventionId) {
          const oldConvention = await Convention.query({ client: trx })
            .where('id', calendar.conventionId)
            .select('id', 'signature_date', 'producers_id', 'buyer_exporter_id')
            .first()

          if (oldConvention) {
            // Récupérer les noms de l'OPA et de l'acheteur/exportateur
            const [opa, buyer] = await Promise.all([
              Actor.query({ client: trx })
                .where('id', oldConvention.producersId)
                .select('family_name')
                .first(),
              Actor.query({ client: trx })
                .where('id', oldConvention.buyerExporterId)
                .select('family_name')
                .first(),
            ])

            const opaFirstWord = opa?.familyName.split(' ')[0] || 'OPA'
            const buyerFirstWord = buyer?.familyName.split(' ')[0] || 'Acheteur'
            const date = oldConvention.signatureDate.toFormat('dd/MM/yyyy')

            oldConventionInfo = `Convention ${opaFirstWord}/${buyerFirstWord} du ${date}`
          }
        }

        if (data.conventionId) {
          const newConvention = await Convention.query({ client: trx })
            .where('id', data.conventionId)
            .select('id', 'signature_date', 'producers_id', 'buyer_exporter_id')
            .first()

          if (newConvention) {
            // Récupérer les noms de l'OPA et de l'acheteur/exportateur
            const [opa, buyer] = await Promise.all([
              Actor.query({ client: trx })
                .where('id', newConvention.producersId)
                .select('family_name')
                .first(),
              Actor.query({ client: trx })
                .where('id', newConvention.buyerExporterId)
                .select('family_name')
                .first(),
            ])

            const opaFirstWord = opa?.familyName.split(' ')[0] || 'OPA'
            const buyerFirstWord = buyer?.familyName.split(' ')[0] || 'Acheteur'
            const date = newConvention.signatureDate.toFormat('dd/MM/yyyy')

            newConventionInfo = `Convention ${opaFirstWord}/${buyerFirstWord} du ${date}`
          }
        }

        oldValues.conventionId = calendar.conventionId
        oldValues.convention = oldConventionInfo
        newValues.conventionId = data.conventionId
        newValues.convention = newConventionInfo
        changedFields.push('conventionId')
      }
      if (data.opaId !== undefined && data.opaId !== calendar.opaId) {
        oldValues.opaId = calendar.opaId
        newValues.opaId = data.opaId
        changedFields.push('opaId')
      }
      if (
        data.expectedSalesCount !== undefined &&
        data.expectedSalesCount !== calendar.expectedSalesCount
      ) {
        oldValues.expectedSalesCount = calendar.expectedSalesCount
        newValues.expectedSalesCount = data.expectedSalesCount
        changedFields.push('expectedSalesCount')
      }

      // Mettre à jour le calendrier
      calendar.merge(data)
      await calendar.save()

      // Créer l'audit log si le contexte est fourni et qu'il y a des modifications
      if (auditContext && changedFields.length > 0) {
        try {
          await AuditLog.logAction({
            auditableType: 'calendar',
            auditableId: calendar.id,
            action: 'update',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: oldValues,
            newValues: newValues,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de la création du log d'audit:", auditError)
        }
      }

      // Recharger les relations
      await calendar.load('campaign')
      await calendar.load('convention')
      await calendar.load('locationRelation')
      await calendar.load('opa')

      return calendar
    })
  }

  /**
   * Mettre à jour le statut d'un calendrier avec audit log
   */
  async updateStatus(
    id: string,
    data: { code: string; status: CalendarStatus },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Calendar> {
    return await db.transaction(async (trx) => {
      const calendar = await Calendar.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .first()

      if (!calendar) {
        throw new Exception('Calendrier non trouvé', {
          code: CalendarErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      // Vérifier que le code saisi correspond au code du calendrier
      if (calendar.code !== data.code) {
        throw new Exception('Le code saisi ne correspond pas au code du calendrier', {
          code: CalendarErrorCodes.CODE_MISMATCH,
          status: 400,
        })
      }

      // Vérifier que la date de début est strictement dans le futur
      if (calendar.startDate <= DateTime.now()) {
        throw new Exception('Impossible de modifier le statut pour une date passée', {
          code: CalendarErrorCodes.PAST_DATE_STATUS_CHANGE,
          status: 400,
        })
      }

      const oldStatus = calendar.status
      calendar.status = data.status
      await calendar.save()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'calendar',
            auditableId: calendar.id,
            action: 'status_update_calendar',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: {
              status: oldStatus,
            },
            newValues: {
              status: data.status,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de la création du log d'audit:", auditError)
        }
      }

      return calendar
    })
  }

  /**
   * Mettre à jour le nombre de ventes attendues avec audit log
   */
  async updateExpectedSalesCount(
    id: string,
    data: { code: string; expectedSalesCount: number },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Calendar> {
    return await db.transaction(async (trx) => {
      const calendar = await Calendar.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .first()

      if (!calendar) {
        throw new Exception('Calendrier non trouvé', {
          code: CalendarErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      // Vérifier que le code saisi correspond au code du calendrier
      if (calendar.code !== data.code) {
        throw new Exception('Le code saisi ne correspond pas au code du calendrier', {
          code: CalendarErrorCodes.CODE_MISMATCH,
          status: 400,
        })
      }

      // Vérifier que le calendrier est de type MARCHE
      if (calendar.type !== 'MARCHE') {
        throw new Exception('Le calendrier doit être de type MARCHE', {
          code: CalendarErrorCodes.INVALID_CALENDAR_TYPE,
          status: 400,
        })
      }

      const oldExpectedSalesCount = calendar.expectedSalesCount
      calendar.expectedSalesCount = data.expectedSalesCount
      await calendar.save()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'calendar',
            auditableId: calendar.id,
            action: 'update',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: {
              expectedSalesCount: oldExpectedSalesCount,
            },
            newValues: {
              expectedSalesCount: data.expectedSalesCount,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de la création du log d'audit:", auditError)
        }
      }

      // Recharger les relations
      await calendar.load('campaign')
      await calendar.load('convention')
      await calendar.load('locationRelation')
      await calendar.load('opa')

      return calendar
    })
  }

  /**
   * Supprimer un calendrier (soft delete)
   */
  async delete(id: string): Promise<Calendar> {
    return await db.transaction(async (trx) => {
      const calendar = await Calendar.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .first()

      if (!calendar) {
        throw new Exception('Calendrier non trouvé', {
          code: CalendarErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      calendar.deletedAt = DateTime.now()
      await calendar.save()

      // TODO: Add audit log when AuditLogService is available

      return calendar
    })
  }

  /**
   * Récupérer tous les calendriers pour la synchronisation (filtrage par rôle)
   * @param options Options de filtrage (userRole, userProductionBasinId, userActorId)
   * @returns Liste des calendriers avec relations préchargées
   */
  async getAllForSync(options: {
    userRole: string
    userProductionBasinId?: string
    userActorId?: string
  }): Promise<Calendar[]> {
    const query = Calendar.query()
      .whereNull('deleted_at')
      .preload('campaign', (campaignQuery) => {
        campaignQuery.select(['id', 'code', 'start_date', 'end_date', 'status'])
      })
      .preload('convention', (conventionQuery) => {
        conventionQuery.select(['id', 'code', 'signature_date'])
      })
      .preload('locationRelation', (locationQuery) => {
        locationQuery.select(['code', 'name', 'type'])
      })
      .preload('opa', (opaQuery) => {
        opaQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .orderBy('updated_at', 'desc')

    // ⭐ FILTRAGE PAR RÔLE
    if (options.userRole === 'basin_admin' || options.userRole === 'field_agent') {
      // Calendriers des OPAs de leur bassin de production uniquement
      if (options.userProductionBasinId) {
        try {
          const basinLocationCodes =
            await this.productionBasinService.getLocationCodesWithPropagation(
              options.userProductionBasinId
            )

          if (basinLocationCodes.length > 0) {
            query.whereHas('opa', (opaQuery) => {
              opaQuery.whereIn('location_code', basinLocationCodes)
            })
          } else {
            query.whereRaw('1 = 0')
          }
        } catch (error) {
          query.whereRaw('1 = 0')
        }
      }
    } else if (options.userRole === 'actor_manager') {
      // Actor Manager: uniquement si c'est un OPA (PRODUCERS) ou BUYER/EXPORTER
      if (options.userActorId) {
        const actor = await Actor.find(options.userActorId)

        if (actor && actor.actorType === 'PRODUCERS') {
          // OPA: uniquement leurs propres calendriers
          query.where('opa_id', options.userActorId)
        } else if (actor && ['BUYER', 'EXPORTER'].includes(actor.actorType)) {
          // BUYER/EXPORTER: tous les MARCHE + ENLEVEMENT liés à leurs conventions
          const activeCampaign = await Campaign.query().where('status', 'active').first()

          query.where((subQuery) => {
            subQuery.where('type', 'MARCHE')
            if (activeCampaign) {
              subQuery.orWhere((enlevementQuery) => {
                enlevementQuery
                  .where('type', 'ENLEVEMENT')
                  .whereHas('convention', (conventionQuery) => {
                    conventionQuery
                      .where('buyer_exporter_id', options.userActorId!)
                      .whereHas('campaigns', (campaignQuery) => {
                        campaignQuery.where('campaigns.id', activeCampaign.id)
                      })
                  })
              })
            }
          })
        }
      }
    }
    // Pour les autres rôles (technical_admin, transformer), pas de filtrage (retourne tout)

    return await query
  }

  /**
   * Récupérer les calendriers modifiés depuis une date (pour sync incrémentale)
   * @param options Options de filtrage (since, userRole, userProductionBasinId, userActorId)
   * @returns Liste des calendriers modifiés avec relations préchargées
   */
  async getUpdatedSince(options: {
    since: Date
    userRole: string
    userProductionBasinId?: string
    userActorId?: string
  }): Promise<Calendar[]> {
    const query = Calendar.query()
      .whereNull('deleted_at')
      .where('updated_at', '>', options.since.toISOString())
      .preload('campaign', (campaignQuery) => {
        campaignQuery.select(['id', 'code', 'start_date', 'end_date', 'status'])
      })
      .preload('convention', (conventionQuery) => {
        conventionQuery.select(['id', 'code', 'signature_date'])
      })
      .preload('locationRelation', (locationQuery) => {
        locationQuery.select(['code', 'name', 'type'])
      })
      .preload('opa', (opaQuery) => {
        opaQuery.select(['id', 'actor_type', 'family_name', 'given_name', 'oncc_id'])
      })
      .orderBy('updated_at', 'desc')

    // ⭐ FILTRAGE PAR RÔLE (même logique que getAllForSync)
    if (options.userRole === 'basin_admin' || options.userRole === 'field_agent') {
      if (options.userProductionBasinId) {
        try {
          const basinLocationCodes =
            await this.productionBasinService.getLocationCodesWithPropagation(
              options.userProductionBasinId
            )

          if (basinLocationCodes.length > 0) {
            query.whereHas('opa', (opaQuery) => {
              opaQuery.whereIn('location_code', basinLocationCodes)
            })
          } else {
            query.whereRaw('1 = 0')
          }
        } catch (error) {
          query.whereRaw('1 = 0')
        }
      }
    } else if (options.userRole === 'actor_manager') {
      if (options.userActorId) {
        const actor = await Actor.find(options.userActorId)

        if (actor && actor.actorType === 'PRODUCERS') {
          query.where('opa_id', options.userActorId)
        } else if (actor && ['BUYER', 'EXPORTER'].includes(actor.actorType)) {
          const activeCampaign = await Campaign.query().where('status', 'active').first()

          query.where((subQuery) => {
            subQuery.where('type', 'MARCHE')
            if (activeCampaign) {
              subQuery.orWhere((enlevementQuery) => {
                enlevementQuery
                  .where('type', 'ENLEVEMENT')
                  .whereHas('convention', (conventionQuery) => {
                    conventionQuery
                      .where('buyer_exporter_id', options.userActorId!)
                      .whereHas('campaigns', (campaignQuery) => {
                        campaignQuery.where('campaigns.id', activeCampaign.id)
                      })
                  })
              })
            }
          })
        }
      }
    }

    return await query
  }
}
