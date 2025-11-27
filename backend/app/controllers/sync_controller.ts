import Actor from '#models/actor'
import Calendar from '#models/calendar'
import Campaign from '#models/campaign'
import Convention from '#models/convention'
import Location from '#models/location'
import ProductionBasinService from '#services/production_basin_service'
import { ACTOR_TYPES_OBJECT } from '#types/actor_types'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// Constantes de l'application
const APP_NAME = 'SIFC'
const APP_VERSION = '1.0.0'

/**
 * Controller pour gérer la synchronisation et les mises à jour
 * Utilisé par le frontend pour vérifier les modifications depuis la dernière synchronisation
 */
@inject()
export default class SyncController {
  constructor(protected productionBasinService: ProductionBasinService) {}

  /**
   * Vérifie s'il y a des mises à jour depuis la dernière synchronisation
   *
   * GET /api/v1/sync/check-updates?lastSync=timestamp
   */
  async checkUpdates({ request, response, auth }: HttpContext) {
    try {
      const lastSync = request.input('lastSync', 0)
      const lastSyncTimestamp = Number.parseInt(lastSync) || 0

      // Vérifier que le timestamp est valide (pas dans le futur)
      const now = Date.now()
      const validTimestamp =
        lastSyncTimestamp > 0 && lastSyncTimestamp <= now
          ? lastSyncTimestamp
          : now - 24 * 60 * 60 * 1000 // 24h par défaut

      const lastSyncDate = new Date(validTimestamp)

      // Récupérer l'utilisateur connecté
      const user = auth.user!

      console.log(
        `🔄 Sync check depuis: ${lastSyncDate.toISOString()} (timestamp: ${validTimestamp})`
      )
      console.log(`👤 Utilisateur: ${user.username} (${user.role})`)

      // ⭐ CALCULER LE NOMBRE DE LOCATIONS MODIFIÉES DEPUIS lastSync
      const modifiedLocationsCount = await Location.query()
        .where('updated_at', '>', lastSyncDate.toISOString())
        .count('* as total')

      const locationsDeltaCount = Number(modifiedLocationsCount[0].$extras.total) || 0

      // ⭐ CALCULER LE NOMBRE DE CAMPAIGNS MODIFIÉES DEPUIS lastSync
      const modifiedCampaignsCount = await Campaign.query()
        .where('updated_at', '>', lastSyncDate.toISOString())
        .count('* as total')

      const campaignsDeltaCount = Number(modifiedCampaignsCount[0].$extras.total) || 0

      // ⭐ CALCULER LE NOMBRE D'ACTEURS MODIFIÉS DEPUIS lastSync
      const modifiedActorsCount = await Actor.query()
        .where('updated_at', '>', lastSyncDate.toISOString())
        .count('* as total')

      const actorsDeltaCount = Number(modifiedActorsCount[0].$extras.total) || 0

      // ⭐ CALCULER LE NOMBRE DE CONVENTIONS MODIFIÉES DEPUIS lastSync
      // Construire la query de base : conventions modifiées dans la campagne active
      const conventionsQuery = Convention.query().where(
        'updated_at',
        '>',
        lastSyncDate.toISOString()
      )

      // Si actor_manager, filtrer par acteur associé
      if (user.role === 'actor_manager' && user.actorId) {
        const actorId = user.actorId // Type narrowing pour TypeScript
        conventionsQuery.where((query) => {
          query.where('producers_id', actorId).orWhere('buyer_exporter_id', actorId)
        })
      }

      const modifiedConventionsCount = await conventionsQuery.count('* as total')
      const conventionsDeltaCount =
        user.role === 'actor_manager' && user.actor.actorType === ACTOR_TYPES_OBJECT.TRANSFORMER
          ? 0
          : Number(modifiedConventionsCount[0].$extras.total) || 0

      // ⭐ CALCULER LE NOMBRE DE CALENDRIERS MODIFIÉS DEPUIS lastSync
      const calendarsQuery = Calendar.query().where('updated_at', '>', lastSyncDate.toISOString())

      // Filtrer par rôle (basin_admin, field_agent, actor_manager)
      if (user.role === 'basin_admin' || user.role === 'field_agent') {
        if (user.productionBasinId) {
          try {
            // Récupérer les locationCodes du bassin avec propagation hiérarchique
            const basinLocationCodes =
              await this.productionBasinService.getLocationCodesWithPropagation(
                user.productionBasinId
              )

            if (basinLocationCodes.length > 0) {
              // Pour les calendriers, filtrer par le locationCode de l'OPA
              calendarsQuery.whereHas('opa', (opaQuery) => {
                opaQuery.whereIn('location_code', basinLocationCodes)
              })
            } else {
              // Si le bassin n'a aucune location, ne retourner aucun résultat
              calendarsQuery.whereRaw('1 = 0')
            }
          } catch (error) {
            // En cas d'erreur, ne retourner aucun résultat
            calendarsQuery.whereRaw('1 = 0')
          }
        }
      } else if (user.role === 'actor_manager' && user.actorId) {
        const actorId = user.actorId
        // Récupérer l'acteur pour vérifier son type
        const actor = await Actor.find(actorId)

        if (actor && actor.actorType === 'PRODUCERS') {
          // OPA: uniquement leurs propres calendriers
          calendarsQuery.where('opa_id', actorId)
        } else if (actor && ['BUYER', 'EXPORTER'].includes(actor.actorType)) {
          // BUYER/EXPORTER: voir tous les MARCHE + ENLEVEMENT liés à leurs conventions
          // Récupérer la campagne active
          const activeCampaign = await Campaign.query().where('status', 'active').first()

          calendarsQuery.where((subQuery) => {
            // Voir tous les calendriers de type MARCHE
            subQuery.where('type', 'MARCHE')
            // OU voir les calendriers ENLEVEMENT liés aux conventions associées à la campagne active
            if (activeCampaign) {
              subQuery.orWhere((enlevementQuery) => {
                enlevementQuery
                  .where('type', 'ENLEVEMENT')
                  .whereHas('convention', (conventionQuery) => {
                    conventionQuery
                      .where('buyer_exporter_id', actorId)
                      .whereHas('campaigns', (campaignQuery) => {
                        campaignQuery.where('campaigns.id', activeCampaign.id)
                      })
                  })
              })
            }
          })
        }
      }

      const modifiedCalendarsCount = await calendarsQuery.count('* as total')
      const calendarsDeltaCount = Number(modifiedCalendarsCount[0].$extras.total) || 0

      const hasUpdates =
        locationsDeltaCount > 0 ||
        campaignsDeltaCount > 0 ||
        actorsDeltaCount > 0 ||
        conventionsDeltaCount > 0 ||
        calendarsDeltaCount > 0

      console.log(`📊 Sync results:`)
      console.log(`  - Mises à jour disponibles: ${hasUpdates}`)
      console.log(`  - Localisations modifiées: ${locationsDeltaCount}`)
      console.log(`  - Campagnes modifiées: ${campaignsDeltaCount}`)
      console.log(`  - Acteurs modifiés: ${actorsDeltaCount}`)
      console.log(`  - Conventions modifiées: ${conventionsDeltaCount}`)
      console.log(`  - Calendriers modifiés: ${calendarsDeltaCount}`)

      return ApiResponse.success(response, SuccessCodes.SYNC_CHECK_SUCCESS, {
        hasUpdates,
        counts: {
          // Delta counts : nombre d'entités modifiées depuis lastSync
          locations: locationsDeltaCount,
          campaigns: campaignsDeltaCount,
          actors: actorsDeltaCount,
          conventions: conventionsDeltaCount,
          calendars: calendarsDeltaCount,
        },
        entities: {
          // Indicateur booléen par entité
          locations: locationsDeltaCount > 0,
          campaigns: campaignsDeltaCount > 0,
          actors: actorsDeltaCount > 0,
          conventions: conventionsDeltaCount > 0,
          calendars: calendarsDeltaCount > 0,
        },
        serverTime: now,
        data: {
          // Données supplémentaires si nécessaire
          app: {
            name: APP_NAME,
            version: APP_VERSION,
          },
          lastSync: validTimestamp,
        },
      })
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de synchronisation:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.SYNC_CHECK_FAILED)
    }
  }
}
