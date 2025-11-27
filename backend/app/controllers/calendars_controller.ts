import CalendarService from '#services/calendar_service'
import ProductionBasinService from '#services/production_basin_service'
import { ErrorCodes, SuccessCodes } from '#types/errors/index'
import { ApiResponse } from '#utils/api_response'
import {
  calendarFiltersValidator,
  createCalendarValidator,
  updateCalendarStatusValidator,
  updateCalendarValidator,
  updateExpectedSalesCountValidator,
} from '#validators/calendar_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

@inject()
export default class CalendarsController {
  constructor(
    protected calendarService: CalendarService,
    protected productionBasinService: ProductionBasinService
  ) {}

  /**
   * GET /calendars
   * Liste des calendriers avec pagination et filtres
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      // Récupérer l'utilisateur authentifié
      const user = auth.user!

      // Validation des filtres
      const validatedFilters = await request.validateUsing(calendarFiltersValidator)

      // Convertir les dates en DateTime pour le service
      const filters = {
        ...validatedFilters,
        startDate: validatedFilters.startDate
          ? validatedFilters.startDate instanceof DateTime
            ? validatedFilters.startDate
            : DateTime.fromJSDate(validatedFilters.startDate)
          : undefined,
        endDate: validatedFilters.endDate
          ? validatedFilters.endDate instanceof DateTime
            ? validatedFilters.endDate
            : DateTime.fromJSDate(validatedFilters.endDate)
          : undefined,
      }

      // Récupérer la liste avec filtrage par rôle
      const calendars = await this.calendarService.list(filters, {
        id: user.id,
        role: user.role,
        productionBasinId: user.productionBasinId || undefined,
        actorId: user.actorId || undefined,
      })

      // Sérialiser les calendriers avec leurs relations
      const serializedCalendars = calendars.all().map((calendar) =>
        calendar.serialize({
          relations: {
            campaign: {
              fields: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
            convention: {
              fields: ['id', 'code', 'signatureDate'],
            },
            locationRelation: {
              fields: ['code', 'name', 'type'],
            },
            opa: {
              fields: ['id', 'familyName', 'givenName', 'actorType'],
            },
          },
        })
      )

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_LIST_SUCCESS,
        {
          data: serializedCalendars,
          meta: calendars.getMeta(),
        },
        200,
        'Liste des calendriers récupérée avec succès'
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_LIST_FAILED)
    }
  }

  /**
   * POST /calendars
   * Créer un nouveau calendrier
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!
      const data = await request.validateUsing(createCalendarValidator)

      // Convertir les dates
      const calendarData = {
        ...data,
        startDate:
          data.startDate instanceof DateTime ? data.startDate : DateTime.fromJSDate(data.startDate),
        endDate:
          data.endDate instanceof DateTime ? data.endDate : DateTime.fromJSDate(data.endDate),
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      const calendar = await this.calendarService.create(calendarData, auditContext)

      // Charger les relations nécessaires pour les notifications
      await calendar.load('opa')
      await calendar.load('locationRelation')

      // Émettre l'événement de notification si c'est un calendrier de type MARCHE
      if (calendar.type === 'MARCHE' && calendar.opa && calendar.locationRelation) {
        const opa = calendar.opa as any

        // Récupérer le bassin de production de l'OPA via propagation hiérarchique
        let productionBasinId: string | null = null

        if (opa.locationCode) {
          try {
            // Récupérer tous les bassins de production
            const allBasins = await this.productionBasinService.list({
              page: 1,
              limit: 1000, // Récupérer tous les bassins (nombre raisonnable)
              withLocations: false,
              withUsers: false,
            })

            // Pour chaque bassin, vérifier si le locationCode de l'OPA appartient à ce bassin
            for (const basin of allBasins.all()) {
              const basinLocationCodes =
                await this.productionBasinService.getLocationCodesWithPropagation(basin.id)

              // Vérifier si le locationCode de l'OPA est dans les codes du bassin (avec propagation)
              if (basinLocationCodes.includes(opa.locationCode)) {
                productionBasinId = basin.id
                break // Bassin trouvé, on arrête la recherche
              }
            }
          } catch (error) {
            // En cas d'erreur, on log mais on n'empêche pas la création du calendrier
            console.error("Erreur lors de la recherche du bassin de production pour l'OPA:", error)
          }
        }

        if (productionBasinId) {
          // Récupérer la localisation hiérarchique
          const hierarchicalLocation = await calendar.locationRelation.getFullPath()

          emitter.emit('calendar:market-created', {
            calendarId: calendar.id,
            calendarCode: calendar.code,
            startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
            endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
            location: calendar.location || 'Non spécifié',
            hierarchicalLocation,
            opaId: opa.id,
            opaName: `${opa.familyName} ${opa.givenName}`,
            productionBasinId,
          })
        }
      }

      // Émettre l'événement de notification si c'est un calendrier de type ENLEVEMENT
      if (calendar.type === 'ENLEVEMENT' && calendar.opa && calendar.locationRelation) {
        try {
          // Charger la convention avec son buyerExporter
          await calendar.load('convention', (convQuery) => {
            convQuery.preload('buyerExporter')
          })

          if (calendar.convention && calendar.convention.buyerExporter) {
            const opa = calendar.opa as any
            const buyerExporter = calendar.convention.buyerExporter as any
            const convention = calendar.convention as any

            // Récupérer la localisation hiérarchique
            const hierarchicalLocation = await calendar.locationRelation.getFullPath()

            emitter.emit('calendar:pickup-created', {
              calendarId: calendar.id,
              calendarCode: calendar.code,
              startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
              endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
              location: calendar.location || 'Non spécifié',
              hierarchicalLocation,
              opaId: opa.id,
              opaName: `${opa.familyName} ${opa.givenName}`,
              buyerExporterId: buyerExporter.id,
              buyerExporterName: `${buyerExporter.familyName} ${buyerExporter.givenName}`,
              conventionCode: convention.code,
            })
          }
        } catch (error) {
          // En cas d'erreur, on log mais on n'empêche pas la création du calendrier
          console.error(
            "Erreur lors de l'émission de l'événement de calendrier d'enlèvement:",
            error
          )
        }
      }

      // Sérialiser le calendrier avec ses relations
      const serializedCalendar = calendar.serialize({
        relations: {
          campaign: {
            fields: ['id', 'code', 'year', 'startDate', 'endDate', 'status'],
          },
          convention: {
            fields: ['id', 'code', 'signatureDate'],
          },
          locationRelation: {
            fields: ['code', 'name', 'type'],
          },
          opa: {
            fields: ['id', 'familyName', 'givenName', 'actorType', 'onccId'],
          },
        },
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_CREATED,
        serializedCalendar,
        201,
        'Calendrier créé avec succès'
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.CALENDAR_CODE_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CODE_EXISTS)
      }

      if (error.message === ErrorCodes.CALENDAR_CAMPAIGN_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CAMPAIGN_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CONVENTION_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CONVENTION_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CONVENTION_REQUIRED) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CONVENTION_REQUIRED)
      }

      if (error.message === ErrorCodes.CALENDAR_OPA_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_OPA_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_OPA_NOT_ACTIVE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_OPA_NOT_ACTIVE)
      }

      if (error.message === ErrorCodes.CALENDAR_INVALID_DATE_RANGE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_INVALID_DATE_RANGE)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CREATE_FAILED)
    }
  }

  /**
   * GET /calendars/:id
   * Récupérer les détails d'un calendrier
   */
  async show({ params, response }: HttpContext) {
    try {
      const calendar = await this.calendarService.show(params.id)

      // Sérialiser le calendrier avec ses relations
      const serializedCalendar = calendar.serialize({
        relations: {
          campaign: {
            fields: ['id', 'code', 'year', 'startDate', 'endDate', 'status'],
          },
          convention: {
            fields: ['id', 'code', 'signatureDate'],
          },
          locationRelation: {
            fields: ['code', 'name', 'type'],
          },
          opa: {
            fields: ['id', 'familyName', 'givenName', 'actorType', 'onccId'],
          },
        },
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_DETAILS_SUCCESS,
        serializedCalendar,
        200,
        'Détails du calendrier récupérés avec succès'
      )
    } catch (error) {
      if (error.message === ErrorCodes.CALENDAR_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.CALENDAR_NOT_FOUND)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_SHOW_FAILED)
    }
  }

  /**
   * PUT /calendars/:id
   * Mettre à jour un calendrier
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!
      const data = await request.validateUsing(updateCalendarValidator)

      // Convertir les dates si présentes
      const calendarData = {
        ...data,
        startDate:
          data.startDate instanceof DateTime
            ? data.startDate
            : data.startDate
              ? DateTime.fromJSDate(data.startDate)
              : undefined,
        endDate:
          data.endDate instanceof DateTime
            ? data.endDate
            : data.endDate
              ? DateTime.fromJSDate(data.endDate)
              : undefined,
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      const calendar = await this.calendarService.update(params.id, calendarData, auditContext)

      // Charger les relations nécessaires pour les notifications
      await calendar.load('opa')
      await calendar.load('locationRelation')

      // Émettre l'événement de notification si c'est un calendrier de type MARCHE
      if (calendar.type === 'MARCHE' && calendar.opa && calendar.locationRelation) {
        const opa = calendar.opa as any

        // Récupérer le bassin de production de l'OPA via propagation hiérarchique
        let productionBasinId: string | null = null

        if (opa.locationCode) {
          try {
            // Récupérer tous les bassins de production
            const allBasins = await this.productionBasinService.list({
              page: 1,
              limit: 1000,
              withLocations: false,
              withUsers: false,
            })

            // Pour chaque bassin, vérifier si le locationCode de l'OPA appartient à ce bassin
            for (const basin of allBasins.all()) {
              const basinLocationCodes =
                await this.productionBasinService.getLocationCodesWithPropagation(basin.id)

              if (basinLocationCodes.includes(opa.locationCode)) {
                productionBasinId = basin.id
                break
              }
            }
          } catch (error) {
            console.error("Erreur lors de la recherche du bassin de production pour l'OPA:", error)
          }
        }

        if (productionBasinId) {
          // Récupérer la localisation hiérarchique
          const hierarchicalLocation = await calendar.locationRelation.getFullPath()

          emitter.emit('calendar:market-updated', {
            calendarId: calendar.id,
            calendarCode: calendar.code,
            startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
            endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
            location: calendar.location || 'Non spécifié',
            hierarchicalLocation,
            opaId: opa.id,
            opaName: `${opa.familyName} ${opa.givenName}`,
            productionBasinId,
          })
        }
      }

      // Émettre l'événement de notification si c'est un calendrier de type ENLEVEMENT
      if (calendar.type === 'ENLEVEMENT' && calendar.opa && calendar.locationRelation) {
        try {
          // Charger la convention avec son buyerExporter
          await calendar.load('convention', (convQuery) => {
            convQuery.preload('buyerExporter')
          })

          if (calendar.convention && calendar.convention.buyerExporter) {
            const opa = calendar.opa as any
            const buyerExporter = calendar.convention.buyerExporter as any
            const convention = calendar.convention as any

            // Récupérer la localisation hiérarchique
            const hierarchicalLocation = await calendar.locationRelation.getFullPath()

            emitter.emit('calendar:pickup-updated', {
              calendarId: calendar.id,
              calendarCode: calendar.code,
              startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
              endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
              location: calendar.location || 'Non spécifié',
              hierarchicalLocation,
              opaId: opa.id,
              opaName: `${opa.familyName} ${opa.givenName}`,
              buyerExporterId: buyerExporter.id,
              buyerExporterName: `${buyerExporter.familyName} ${buyerExporter.givenName}`,
              conventionCode: convention.code,
            })
          }
        } catch (error) {
          console.error(
            "Erreur lors de l'émission de l'événement de calendrier d'enlèvement:",
            error
          )
        }
      }

      // Sérialiser le calendrier avec ses relations
      const serializedCalendar = calendar.serialize({
        relations: {
          campaign: {
            fields: ['id', 'code', 'year', 'startDate', 'endDate', 'status'],
          },
          convention: {
            fields: ['id', 'code', 'signatureDate'],
          },
          locationRelation: {
            fields: ['code', 'name', 'type'],
          },
          opa: {
            fields: ['id', 'familyName', 'givenName', 'actorType', 'onccId'],
          },
        },
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_UPDATED,
        serializedCalendar,
        200,
        'Calendrier mis à jour avec succès'
      )
    } catch (error) {
      console.log(error)

      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.CALENDAR_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.CALENDAR_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CAMPAIGN_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CAMPAIGN_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CONVENTION_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CONVENTION_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_OPA_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_OPA_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_OPA_NOT_ACTIVE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_OPA_NOT_ACTIVE)
      }

      if (error.message === ErrorCodes.CALENDAR_INVALID_DATE_RANGE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_INVALID_DATE_RANGE)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_UPDATE_FAILED)
    }
  }

  /**
   * PATCH /calendars/:id/status
   * Mettre à jour le statut d'un calendrier
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!
      const data = await request.validateUsing(updateCalendarStatusValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      const calendar = await this.calendarService.updateStatus(params.id, data, auditContext)

      // Émettre l'événement de notification si le calendrier est annulé (statut: inactive)
      if (calendar.status === 'inactive') {
        // Charger les relations nécessaires pour les notifications
        await calendar.load('opa')
        await calendar.load('locationRelation')

        // Émettre l'événement de notification si c'est un calendrier de type MARCHE
        if (calendar.type === 'MARCHE' && calendar.opa && calendar.locationRelation) {
          const opa = calendar.opa as any

          // Récupérer le bassin de production de l'OPA via propagation hiérarchique
          let productionBasinId: string | null = null

          if (opa.locationCode) {
            try {
              // Récupérer tous les bassins de production
              const allBasins = await this.productionBasinService.list({
                page: 1,
                limit: 1000,
                withLocations: false,
                withUsers: false,
              })

              // Pour chaque bassin, vérifier si le locationCode de l'OPA appartient à ce bassin
              for (const basin of allBasins.all()) {
                const basinLocationCodes =
                  await this.productionBasinService.getLocationCodesWithPropagation(basin.id)

                if (basinLocationCodes.includes(opa.locationCode)) {
                  productionBasinId = basin.id
                  break
                }
              }
            } catch (error) {
              console.error(
                "Erreur lors de la recherche du bassin de production pour l'OPA:",
                error
              )
            }
          }

          if (productionBasinId) {
            // Récupérer la localisation hiérarchique
            const hierarchicalLocation = await calendar.locationRelation.getFullPath()

            emitter.emit('calendar:market-cancelled', {
              calendarId: calendar.id,
              calendarCode: calendar.code,
              startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
              endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
              location: calendar.location || 'Non spécifié',
              hierarchicalLocation,
              opaId: opa.id,
              opaName: `${opa.familyName} ${opa.givenName}`,
              productionBasinId,
            })
          }
        }

        // Émettre l'événement de notification si c'est un calendrier de type ENLEVEMENT
        if (calendar.type === 'ENLEVEMENT' && calendar.opa && calendar.locationRelation) {
          try {
            // Charger la convention avec son buyerExporter
            await calendar.load('convention', (convQuery) => {
              convQuery.preload('buyerExporter')
            })

            if (calendar.convention && calendar.convention.buyerExporter) {
              const opa = calendar.opa as any
              const buyerExporter = calendar.convention.buyerExporter as any
              const convention = calendar.convention as any

              // Récupérer la localisation hiérarchique
              const hierarchicalLocation = await calendar.locationRelation.getFullPath()

              emitter.emit('calendar:pickup-cancelled', {
                calendarId: calendar.id,
                calendarCode: calendar.code,
                startDate: calendar.startDate.toFormat('yyyy-MM-dd'),
                endDate: calendar.endDate.toFormat('yyyy-MM-dd'),
                location: calendar.location || 'Non spécifié',
                hierarchicalLocation,
                opaId: opa.id,
                opaName: `${opa.familyName} ${opa.givenName}`,
                buyerExporterId: buyerExporter.id,
                buyerExporterName: `${buyerExporter.familyName} ${buyerExporter.givenName}`,
                conventionCode: convention.code,
              })
            }
          } catch (error) {
            console.error(
              "Erreur lors de l'émission de l'événement de calendrier d'enlèvement:",
              error
            )
          }
        }
      }

      // Sérialiser le calendrier
      const serializedCalendar = calendar.serialize({
        relations: {
          campaign: {
            fields: ['id', 'code', 'startDate', 'endDate', 'status'],
          },
          convention: {
            fields: ['id', 'code', 'status'],
          },
        },
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_STATUS_UPDATED,
        serializedCalendar,
        200,
        'Statut du calendrier mis à jour avec succès'
      )
    } catch (error) {
      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.CALENDAR_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.CALENDAR_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CODE_MISMATCH) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CODE_MISMATCH)
      }

      if (error.message === ErrorCodes.CALENDAR_PAST_DATE_STATUS_CHANGE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.CALENDAR_PAST_DATE_STATUS_CHANGE
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_STATUS_UPDATE_FAILED)
    }
  }

  /**
   * PATCH /calendars/:id/expected-sales-count
   * Mettre à jour le nombre de ventes attendues (field_agent et basin_admin seulement)
   */
  async updateExpectedSalesCount({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user!

      // Vérifier les permissions (seulement field_agent et basin_admin)
      if (!['field_agent', 'basin_admin'].includes(user.role)) {
        return ApiResponse.fromException(
          response,
          new Error('CALENDAR_UPDATE_NOT_AUTHORIZED'),
          ErrorCodes.CALENDAR_UPDATE_NOT_AUTHORIZED
        )
      }

      const data = await request.validateUsing(updateExpectedSalesCountValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      const calendar = await this.calendarService.updateExpectedSalesCount(
        params.id,
        data,
        auditContext
      )

      // Sérialiser le calendrier
      const serializedCalendar = calendar.serialize({
        relations: {
          campaign: {
            fields: ['id', 'code', 'startDate', 'endDate', 'status'],
          },
          convention: {
            fields: ['id', 'code', 'status'],
          },
          locationRelation: {
            fields: ['code', 'name', 'type'],
          },
          opa: {
            fields: ['id', 'familyName', 'givenName', 'actorType', 'onccId'],
          },
        },
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_EXPECTED_SALES_COUNT_UPDATED,
        serializedCalendar,
        200,
        'Nombre de ventes attendues mis à jour avec succès'
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.message === ErrorCodes.CALENDAR_NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.CALENDAR_NOT_FOUND)
      }

      if (error.message === ErrorCodes.CALENDAR_CODE_MISMATCH) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_CODE_MISMATCH)
      }

      if (error.message === ErrorCodes.CALENDAR_INVALID_CALENDAR_TYPE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_INVALID_CALENDAR_TYPE)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_UPDATE_FAILED)
    }
  }

  /**
   * DELETE /calendars/:id
   * Supprimer un calendrier (soft delete)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const calendar = await this.calendarService.delete(params.id)

      // Sérialiser le calendrier
      const serializedCalendar = calendar.serialize({
        fields: ['id', 'code'],
      })

      return ApiResponse.success(
        response,
        SuccessCodes.CALENDAR_DELETED,
        serializedCalendar,
        200,
        'Calendrier supprimé avec succès'
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_DELETE_FAILED)
    }
  }

  /**
   * GET /calendars/sync/all
   * Récupérer tous les calendriers pour la synchronisation (filtrage par rôle)
   */
  async syncAll({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Récupérer tous les calendriers avec filtrage par rôle
      const calendars = await this.calendarService.getAllForSync({
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
        userActorId: user.actorId || undefined,
      })

      // Sérialiser les calendriers avec leurs relations
      const serialized = calendars.map((calendar) =>
        calendar.serialize({
          relations: {
            campaign: {
              fields: {
                pick: ['id', 'code', 'startDate', 'endDate', 'status'],
              },
            },
            convention: {
              fields: {
                pick: ['id', 'code', 'signatureDate'],
              },
            },
            locationRelation: {
              fields: {
                pick: ['code', 'name', 'type'],
              },
            },
            opa: {
              fields: {
                pick: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
              },
            },
          },
        })
      )

      return ApiResponse.success(response, SuccessCodes.CALENDAR_SYNC_SUCCESS, {
        calendars: serialized,
        total: serialized.length,
        syncedAt: Date.now(),
      })
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_SYNC_FAILED)
    }
  }

  /**
   * GET /calendars/sync/updates
   * Récupérer les calendriers modifiés depuis une date (sync incrémentale)
   */
  async syncUpdates({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Récupérer le timestamp 'since' depuis les query params
      const since = request.input('since')
      if (!since) {
        return ApiResponse.validationError(response, [
          {
            field: 'since',
            message: 'Le paramètre "since" (timestamp) est requis',
          },
        ])
      }

      // Convertir le timestamp en DateTime
      const sinceTimestamp = Number.parseInt(since, 10)
      if (Number.isNaN(sinceTimestamp)) {
        return ApiResponse.validationError(response, [
          {
            field: 'since',
            message: 'Le paramètre "since" doit être un timestamp valide',
          },
        ])
      }

      const sinceDate = new Date(sinceTimestamp)

      // Récupérer les calendriers modifiés avec filtrage par rôle
      const calendars = await this.calendarService.getUpdatedSince({
        since: sinceDate,
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
        userActorId: user.actorId || undefined,
      })

      // Sérialiser les calendriers avec leurs relations
      const serialized = calendars.map((calendar) =>
        calendar.serialize({
          relations: {
            campaign: {
              fields: {
                pick: ['id', 'code', 'startDate', 'endDate', 'status'],
              },
            },
            convention: {
              fields: {
                pick: ['id', 'code', 'signatureDate'],
              },
            },
            locationRelation: {
              fields: {
                pick: ['code', 'name', 'type'],
              },
            },
            opa: {
              fields: {
                pick: ['id', 'actorType', 'familyName', 'givenName', 'onccId'],
              },
            },
          },
        })
      )

      return ApiResponse.success(response, SuccessCodes.CALENDAR_SYNC_SUCCESS, {
        calendars: serialized,
        total: serialized.length,
        since: sinceTimestamp,
        syncedAt: Date.now(),
      })
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CALENDAR_SYNC_FAILED)
    }
  }
}
