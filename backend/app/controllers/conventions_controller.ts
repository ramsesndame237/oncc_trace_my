import ConventionService from '#services/convention_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import {
  associateCampaignValidator,
  createConventionValidator,
  updateConventionValidator,
} from '#validators/convention_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

@inject()
export default class ConventionsController {
  constructor(protected conventionService: ConventionService) {}

  /**
   * Ajouter le statut à une convention sérialisée
   */
  private async addStatusToConvention(serialized: any): Promise<any> {
    const activeCampaign = await this.conventionService.getActiveCampaign()

    const isActive =
      activeCampaign &&
      serialized.campaigns &&
      serialized.campaigns.some((campaign: any) => campaign.id === activeCampaign.id)

    return {
      ...serialized,
      status: isActive ? 'active' : 'inactive',
    }
  }

  /**
   * Lister toutes les conventions (avec pagination et filtres)
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      // Récupérer l'utilisateur authentifié
      const user = auth.user!

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const buyerExporterId = request.input('buyerExporterId')
      const producersId = request.input('producersId')
      const campaignId = request.input('campaignId')
      const search = request.input('search')

      // Utiliser le service pour récupérer les conventions avec filtrage par rôle
      const conventions = await this.conventionService.list(
        page,
        limit,
        {
          buyerExporterId,
          producersId,
          campaignId,
          search,
        },
        {
          id: user.id,
          role: user.role,
          productionBasinId: user.productionBasinId || undefined,
          actorId: user.actorId || undefined,
        }
      )

      // Sérialiser les conventions
      const serialized = conventions.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Récupérer la campagne active une fois
      const activeCampaign = await this.conventionService.getActiveCampaign()

      // Ajouter le statut à chaque convention
      if (serialized.data) {
        serialized.data = serialized.data.map((convention: any) => {
          // Vérifier si la convention est associée à la campagne active
          const isActive =
            activeCampaign &&
            convention.campaigns &&
            convention.campaigns.some((campaign: any) => campaign.id === activeCampaign.id)

          return {
            ...convention,
            status: isActive ? 'active' : 'inactive',
          }
        })
      }

      return ApiResponse.success(response, SuccessCodes.CONVENTION_LIST_SUCCESS, serialized)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_LIST_FAILED)
    }
  }

  /**
   * Créer une nouvelle convention
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      const data = await request.validateUsing(createConventionValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Convertir la date en DateTime si nécessaire
      const conventionData = {
        ...data,
        signatureDate: DateTime.fromJSDate(data.signatureDate),
      }

      // Créer la convention via le service avec audit log intégré
      const convention = await this.conventionService.create(conventionData, auditContext)

      // Si l'utilisateur est un FIELD_AGENT, associer automatiquement à la campagne active
      if (authUser.role === 'field_agent') {
        const activeCampaign = await this.conventionService.getActiveCampaign()

        if (activeCampaign) {
          await this.conventionService.associateCampaign(
            convention.id,
            activeCampaign.id,
            auditContext
          )
        }
      }

      // Charger les relations pour la réponse
      await convention.load('buyerExporter')
      await convention.load('producers')
      await convention.load('campaigns')

      // Sérialiser la convention
      const serialized = convention.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Ajouter le statut à la convention
      const conventionWithStatus = await this.addStatusToConvention(serialized)

      // Émettre un événement pour envoyer les notifications en arrière-plan
      try {
        await authUser.load('actor')

        emitter.emit('convention:created', {
          convention: {
            id: convention.id,
            code: convention.code,
            signatureDate: convention.signatureDate.toFormat('dd/MM/yyyy'),
            products: convention.products.map((p: any) => ({
              code: p.code,
              name: p.name,
              quantity: p.quantity,
              unit: p.unit,
            })),
          },
          buyerExporter: {
            id: convention.buyerExporter.id,
            fullName:
              `${convention.buyerExporter.familyName || ''} ${convention.buyerExporter.givenName || ''}`.trim(),
            actorType: convention.buyerExporter.actorType,
          },
          producers: {
            id: convention.producers.id,
            fullName:
              `${convention.producers.familyName || ''} ${convention.producers.givenName || ''}`.trim(),
          },
          createdBy: {
            id: authUser.id,
            fullName:
              `${authUser.givenName || ''} ${authUser.familyName || ''}`.trim() ||
              authUser.username,
            actorId: authUser.actorId,
          },
        })

        console.log("📧 Événement convention:created émis - notifications en cours d'envoi")
      } catch (eventError) {
        console.error("Erreur lors de l'émission de l'événement convention:created:", eventError)
        // Ne pas faire échouer la création si l'événement échoue
      }

      return ApiResponse.created(
        response,
        SuccessCodes.CONVENTION_CREATED,
        conventionWithStatus,
        'Convention créée avec succès'
      )
    } catch (error) {
      console.error('Error creating convention:', error)
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.code === ErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_FOUND) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_FOUND
        )
      }

      if (error.code === ErrorCodes.CONVENTION_INVALID_BUYER_EXPORTER_TYPE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.CONVENTION_INVALID_BUYER_EXPORTER_TYPE
        )
      }

      if (error.code === ErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_ACTIVE) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_ACTIVE
        )
      }

      if (error.code === ErrorCodes.CONVENTION_OPA_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_OPA_NOT_FOUND)
      }

      if (error.code === ErrorCodes.CONVENTION_OPA_NOT_ACTIVE) {
        return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_OPA_NOT_ACTIVE)
      }

      if (error.code === ErrorCodes.CONVENTION_NO_PRODUCTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_NO_PRODUCTS)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_CREATE_FAILED)
    }
  }

  /**
   * Afficher une convention spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const convention = await this.conventionService.findById(params.id)

      // Sérialiser la convention
      const serialized = convention.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Ajouter le statut à la convention
      const conventionWithStatus = await this.addStatusToConvention(serialized)

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_SHOW_SUCCESS,
        conventionWithStatus
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_SHOW_FAILED)
    }
  }

  /**
   * Mettre à jour une convention
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const data = await request.validateUsing(updateConventionValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Récupérer la convention avant modification pour comparer les changements
      const oldConvention = await this.conventionService.findById(params.id)
      await oldConvention.load('buyerExporter')
      await oldConvention.load('producers')

      const oldSignatureDate = oldConvention.signatureDate.toFormat('dd/MM/yyyy')
      const oldProducts = JSON.stringify(oldConvention.products)

      // Convertir la date en DateTime si fournie
      const conventionData: typeof data & { signatureDate?: any } = { ...data }
      if (data.signatureDate) {
        conventionData.signatureDate = DateTime.fromJSDate(data.signatureDate)
      }

      // Mettre à jour via le service avec audit log intégré
      const convention = await this.conventionService.update(
        params.id,
        conventionData,
        auditContext
      )

      // Charger les relations pour la réponse
      await convention.load('buyerExporter')
      await convention.load('producers')
      await convention.load('campaigns')

      // Sérialiser la convention
      const serialized = convention.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Ajouter le statut à la convention
      const conventionWithStatus = await this.addStatusToConvention(serialized)

      // Émettre un événement pour envoyer les notifications en arrière-plan
      try {
        const newSignatureDate = convention.signatureDate.toFormat('dd/MM/yyyy')
        const newProducts = JSON.stringify(convention.products)

        const signatureDateChanged = oldSignatureDate !== newSignatureDate
        const productsChanged = oldProducts !== newProducts

        // Émettre l'événement seulement si au moins un changement a été détecté
        if (signatureDateChanged || productsChanged) {
          // Mapper les qualités et standards pour affichage
          const qualityMapping: Record<string, string> = {
            grade_1: 'Grade 1',
            grade_2: 'Grade 2',
            cocoa_bk: 'Cacao BK',
          }

          const standardMapping: Record<string, string> = {
            conventional: 'Conventionnel',
            organic: 'Biologique',
            fair_trade: 'Commerce équitable',
          }

          emitter.emit('convention:updated', {
            convention: {
              id: convention.id,
              code: convention.code,
              signatureDate: newSignatureDate,
              products: convention.products.map((p: any) => ({
                code: p.code || 'N/A',
                name: p.name || 'N/A',
                quality: qualityMapping[p.quality] || p.quality,
                standard: standardMapping[p.standard] || p.standard,
                weight: p.weight,
                bags: p.bags,
                pricePerKg: p.pricePerKg,
                humidity: p.humidity,
              })),
            },
            changes: {
              signatureDateChanged,
              productsChanged,
              oldSignatureDate: signatureDateChanged ? oldSignatureDate : undefined,
              newSignatureDate: signatureDateChanged ? newSignatureDate : undefined,
            },
            buyerExporter: {
              id: convention.buyerExporter.id,
              fullName:
                `${convention.buyerExporter.familyName || ''} ${convention.buyerExporter.givenName || ''}`.trim(),
              actorType: convention.buyerExporter.actorType,
            },
            producers: {
              id: convention.producers.id,
              fullName:
                `${convention.producers.familyName || ''} ${convention.producers.givenName || ''}`.trim(),
            },
            updatedBy: {
              id: authUser.id,
              fullName:
                `${authUser.givenName || ''} ${authUser.familyName || ''}`.trim() ||
                authUser.username,
            },
          })

          console.log("📧 Événement convention:updated émis - notifications en cours d'envoi")
        }
      } catch (eventError) {
        console.error("Erreur lors de l'émission de l'événement convention:updated:", eventError)
        // Ne pas faire échouer la mise à jour si l'événement échoue
      }

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_UPDATE_SUCCESS,
        conventionWithStatus,
        200,
        'Convention mise à jour avec succès'
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_UPDATE_FAILED)
    }
  }

  /**
   * Associer une convention à une campagne
   */
  async associateCampaign({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const data = await request.validateUsing(associateCampaignValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Associer via le service avec audit log intégré
      const convention = await this.conventionService.associateCampaign(
        params.id,
        data.campaignId,
        auditContext
      )

      // Charger les relations pour la réponse
      await convention.load('buyerExporter')
      await convention.load('producers')
      await convention.load('campaigns')

      // Sérialiser la convention
      const serialized = convention.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Ajouter le statut à la convention
      const conventionWithStatus = await this.addStatusToConvention(serialized)

      // Émettre un événement pour envoyer les notifications en arrière-plan
      try {
        // Trouver la campagne dans les relations de la convention
        const associatedCampaign = convention.campaigns.find((c: any) => c.id === data.campaignId)

        if (associatedCampaign) {
          emitter.emit('convention:associated-to-campaign', {
            convention: {
              id: convention.id,
              code: convention.code,
              signatureDate: convention.signatureDate.toFormat('dd/MM/yyyy'),
            },
            campaign: {
              id: associatedCampaign.id,
              code: associatedCampaign.code,
              startDate: associatedCampaign.startDate.toFormat('dd/MM/yyyy'),
              endDate: associatedCampaign.endDate.toFormat('dd/MM/yyyy'),
            },
            buyerExporter: {
              id: convention.buyerExporter.id,
              fullName:
                `${convention.buyerExporter.familyName || ''} ${convention.buyerExporter.givenName || ''}`.trim(),
              actorType: convention.buyerExporter.actorType,
            },
            producers: {
              id: convention.producers.id,
              fullName:
                `${convention.producers.familyName || ''} ${convention.producers.givenName || ''}`.trim(),
            },
            associatedBy: {
              id: authUser.id,
              fullName:
                `${authUser.givenName || ''} ${authUser.familyName || ''}`.trim() ||
                authUser.username,
            },
          })

          console.log(
            "📧 Événement convention:associated-to-campaign émis - notifications en cours d'envoi"
          )
        }
      } catch (eventError) {
        console.error(
          "Erreur lors de l'émission de l'événement convention:associated-to-campaign:",
          eventError
        )
        // Ne pas faire échouer l'association si l'événement échoue
      }

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_CAMPAIGN_ASSOCIATE_SUCCESS,
        conventionWithStatus,
        200,
        'Convention associée à la campagne avec succès'
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.CONVENTION_CAMPAIGN_ASSOCIATE_FAILED
      )
    }
  }

  /**
   * Dissocier une convention d'une campagne
   */
  async dissociateCampaign({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const { campaignId } = request.only(['campaignId'])

      if (!campaignId) {
        return ApiResponse.error(
          response,
          ErrorCodes.CONVENTION_CAMPAIGN_ID_MISSING,
          400,
          "L'ID de la campagne est requis"
        )
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Récupérer les infos de la campagne AVANT dissociation pour l'événement
      const conventionBefore = await this.conventionService.findById(params.id)
      await conventionBefore.load('campaigns')
      await conventionBefore.load('buyerExporter')
      await conventionBefore.load('producers')

      const campaignToRemove = conventionBefore.campaigns.find((c: any) => c.id === campaignId)

      // Dissocier via le service avec audit log intégré
      const convention = await this.conventionService.dissociateCampaign(
        params.id,
        campaignId,
        auditContext
      )

      // Charger les relations pour la réponse
      await convention.load('buyerExporter')
      await convention.load('producers')
      await convention.load('campaigns')

      // Sérialiser la convention
      const serialized = convention.serialize({
        relations: {
          buyerExporter: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          producers: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'email',
                'phone',
                'onccId',
                'status',
              ],
            },
          },
          campaigns: {
            fields: {
              pick: ['id', 'code', 'startDate', 'endDate', 'status'],
            },
          },
        },
      })

      // Ajouter le statut à la convention
      const conventionWithStatus = await this.addStatusToConvention(serialized)

      // Émettre un événement pour envoyer les notifications en arrière-plan
      try {
        if (campaignToRemove) {
          emitter.emit('convention:dissociated-from-campaign', {
            convention: {
              id: convention.id,
              code: convention.code,
              signatureDate: convention.signatureDate.toFormat('dd/MM/yyyy'),
            },
            campaign: {
              id: campaignToRemove.id,
              code: campaignToRemove.code,
              startDate: campaignToRemove.startDate.toFormat('dd/MM/yyyy'),
              endDate: campaignToRemove.endDate.toFormat('dd/MM/yyyy'),
            },
            buyerExporter: {
              id: convention.buyerExporter.id,
              fullName:
                `${convention.buyerExporter.familyName || ''} ${convention.buyerExporter.givenName || ''}`.trim(),
              actorType: convention.buyerExporter.actorType,
            },
            producers: {
              id: convention.producers.id,
              fullName:
                `${convention.producers.familyName || ''} ${convention.producers.givenName || ''}`.trim(),
            },
            dissociatedBy: {
              id: authUser.id,
              fullName:
                `${authUser.givenName || ''} ${authUser.familyName || ''}`.trim() ||
                authUser.username,
            },
          })

          console.log(
            "📧 Événement convention:dissociated-from-campaign émis - notifications en cours d'envoi"
          )
        }
      } catch (eventError) {
        console.error(
          "Erreur lors de l'émission de l'événement convention:dissociated-from-campaign:",
          eventError
        )
        // Ne pas faire échouer la dissociation si l'événement échoue
      }

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_CAMPAIGN_DISSOCIATE_SUCCESS,
        conventionWithStatus,
        200,
        'Convention dissociée de la campagne avec succès'
      )
    } catch (error) {
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.CONVENTION_CAMPAIGN_DISSOCIATE_FAILED
      )
    }
  }

  /**
   * Supprimer (soft delete) une convention
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

      // Supprimer via le service avec audit log intégré
      await this.conventionService.delete(params.id, auditContext)

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_DELETE_SUCCESS,
        null,
        200,
        'Convention supprimée avec succès'
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_DELETE_FAILED)
    }
  }

  /**
   * Sync All - Initial sync for offline mobile clients
   * Returns all conventions without pagination
   * GET /conventions/sync/all
   */
  async syncAll({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      console.log(`🔄 Sync initiale des conventions demandée par ${user.username} (${user.role})`)

      // Récupérer toutes les conventions pour cet utilisateur
      const conventions = await this.conventionService.getAllForSync({
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
        userActorId: user.actorId || undefined,
      })

      // Sérialiser les conventions
      const serialized = conventions.map((convention) =>
        convention.serialize({
          relations: {
            buyerExporter: {
              fields: {
                pick: [
                  'id',
                  'actorType',
                  'familyName',
                  'givenName',
                  'email',
                  'phone',
                  'onccId',
                  'status',
                ],
              },
            },
            producers: {
              fields: {
                pick: [
                  'id',
                  'actorType',
                  'familyName',
                  'givenName',
                  'email',
                  'phone',
                  'onccId',
                  'status',
                ],
              },
            },
            campaigns: {
              fields: {
                pick: ['id', 'code', 'startDate', 'endDate', 'status'],
              },
            },
          },
        })
      )

      // Récupérer la campagne active une fois
      const activeCampaign = await this.conventionService.getActiveCampaign()

      // Ajouter le statut à chaque convention
      const conventionsWithStatus = serialized.map((convention: any) => {
        const isActive =
          activeCampaign &&
          convention.campaigns &&
          convention.campaigns.some((campaign: any) => campaign.id === activeCampaign.id)

        return {
          ...convention,
          status: isActive ? 'active' : 'inactive',
        }
      })

      console.log(
        `✅ ${conventionsWithStatus.length} convention(s) renvoyée(s) pour la sync initiale`
      )

      return ApiResponse.success(response, SuccessCodes.CONVENTION_SYNC_SUCCESS, {
        conventions: conventionsWithStatus,
        total: conventionsWithStatus.length,
        syncedAt: Date.now(),
      })
    } catch (error) {
      console.error('Erreur lors de la sync initiale des conventions:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_SYNC_FAILED)
    }
  }

  /**
   * Sync Updates - Incremental sync for offline mobile clients
   * Returns only conventions modified since the given timestamp
   * GET /conventions/sync/updates?since=timestamp
   */
  async syncUpdates({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const since = request.input('since')

      if (!since) {
        return ApiResponse.error(
          response,
          ErrorCodes.CONVENTION_SYNC_FAILED,
          400,
          'Le paramètre "since" (timestamp) est requis'
        )
      }

      const sinceTimestamp = Number.parseInt(since, 10)

      if (Number.isNaN(sinceTimestamp) || sinceTimestamp <= 0) {
        return ApiResponse.error(
          response,
          ErrorCodes.CONVENTION_SYNC_FAILED,
          400,
          'Le paramètre "since" doit être un timestamp valide'
        )
      }

      const sinceDate = new Date(sinceTimestamp)

      console.log(
        `🔄 Sync incrémentale des conventions depuis ${sinceDate.toISOString()} demandée par ${user.username} (${user.role})`
      )

      // Récupérer les conventions modifiées depuis la date donnée
      const conventions = await this.conventionService.getUpdatedSince({
        since: sinceDate,
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
        userActorId: user.actorId || undefined,
      })

      // Sérialiser les conventions
      const serialized = conventions.map((convention) =>
        convention.serialize({
          relations: {
            buyerExporter: {
              fields: {
                pick: [
                  'id',
                  'actorType',
                  'familyName',
                  'givenName',
                  'email',
                  'phone',
                  'onccId',
                  'status',
                ],
              },
            },
            producers: {
              fields: {
                pick: [
                  'id',
                  'actorType',
                  'familyName',
                  'givenName',
                  'email',
                  'phone',
                  'onccId',
                  'status',
                ],
              },
            },
            campaigns: {
              fields: {
                pick: ['id', 'code', 'startDate', 'endDate', 'status'],
              },
            },
          },
        })
      )

      // Récupérer la campagne active une fois
      const activeCampaign = await this.conventionService.getActiveCampaign()

      // Ajouter le statut à chaque convention
      const conventionsWithStatus = serialized.map((convention: any) => {
        const isActive =
          activeCampaign &&
          convention.campaigns &&
          convention.campaigns.some((campaign: any) => campaign.id === activeCampaign.id)

        return {
          ...convention,
          status: isActive ? 'active' : 'inactive',
        }
      })

      console.log(
        `✅ ${conventionsWithStatus.length} convention(s) modifiée(s) renvoyée(s) pour la sync incrémentale`
      )

      return ApiResponse.success(response, SuccessCodes.CONVENTION_SYNC_SUCCESS, {
        conventions: conventionsWithStatus,
        total: conventionsWithStatus.length,
        since: sinceTimestamp,
        syncedAt: Date.now(),
      })
    } catch (error) {
      console.error('Erreur lors de la sync incrémentale des conventions:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_SYNC_FAILED)
    }
  }
}
