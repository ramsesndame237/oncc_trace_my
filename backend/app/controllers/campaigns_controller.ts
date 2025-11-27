import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Store from '#models/store'
import CampaignService from '#services/campaign_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { createCampaignValidator, updateCampaignValidator } from '#validators/campaign_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class CampaignsController {
  constructor(protected campaignService: CampaignService) {}
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search')

      const query = Campaign.query()

      // Recherche par code de campagne
      if (search) {
        query.where('code', 'ILIKE', `%${search}%`)
      }

      // Ordonner par date de début (plus récent en premier)
      query.orderBy('startDate', 'desc')

      const campaigns = await query.paginate(page, limit)

      return ApiResponse.success(
        response,
        SuccessCodes.CAMPAIGN_LIST_SUCCESS,
        campaigns.serialize()
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_LIST_FAILED)
    }
  }

  /**
   * Get the currently active campaign
   */
  async getActive({ response }: HttpContext) {
    try {
      const activeCampaign = await Campaign.getActiveCampaign()

      if (!activeCampaign) {
        return ApiResponse.success(response, SuccessCodes.CAMPAIGN_FETCH_SUCCESS, null)
      }

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_FETCH_SUCCESS, activeCampaign)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_LIST_FAILED)
    }
  }

  /**
   * Get the total count of campaigns
   */
  async count({ response }: HttpContext) {
    try {
      const count = await Campaign.query().count('* as total')
      const totalCampaigns = Number(count[0].$extras.total)

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_COUNT_SUCCESS, {
        count: totalCampaigns,
      })
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_COUNT_FAILED)
    }
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.CAMPAIGN_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(createCampaignValidator)
      const campaign = await this.campaignService.create({
        startDate: payload.startDate,
        endDate: payload.endDate,
      })

      // Enregistrer la création dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'Campaign',
          auditableId: campaign.id,
          action: 'create',
          userId: user.id,
          userRole: user.role,
          oldValues: null,
          newValues: {
            code: campaign.code,
            startDate: campaign.startDate?.toISODate(),
            endDate: campaign.endDate?.toISODate(),
            status: campaign.status,
          },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer la création si l'audit log échoue
      }

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_CREATED, campaign, 201)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.CAMPAIGN_OVERLAP) {
        return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_OVERLAP)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_CREATION_FAILED)
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const campaign = await Campaign.findOrFail(params.id)
      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_FETCH_SUCCESS, campaign)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_NOT_FOUND)
    }
  }

  /**
   * Handle form submission for the update action
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.CAMPAIGN_NOT_AUTHORIZED)
      }

      // Récupérer la campagne existante pour l'audit log
      const existingCampaign = await Campaign.findOrFail(params.id)
      const originalValues = {
        startDate: existingCampaign.startDate,
        endDate: existingCampaign.endDate,
        status: existingCampaign.status,
      }

      const payload = await request.validateUsing(updateCampaignValidator)
      const campaign = await this.campaignService.update(params.id, payload)

      // Enregistrer la modification dans l'audit log
      try {
        // Déterminer les champs modifiés
        const changedFields: Record<string, any> = {}
        const newValues: Record<string, any> = {}
        const oldValues: Record<string, any> = {}

        if (
          payload.startDate &&
          JSON.stringify(payload.startDate) !== JSON.stringify(originalValues.startDate)
        ) {
          changedFields.startDate = payload.startDate
          newValues.startDate = payload.startDate
          oldValues.startDate = originalValues.startDate
        }

        if (
          payload.endDate &&
          JSON.stringify(payload.endDate) !== JSON.stringify(originalValues.endDate)
        ) {
          changedFields.endDate = payload.endDate
          newValues.endDate = payload.endDate
          oldValues.endDate = originalValues.endDate
        }

        // Enregistrer l'audit log seulement s'il y a des modifications
        if (Object.keys(changedFields).length > 0) {
          await AuditLog.logAction({
            auditableType: 'Campaign',
            auditableId: campaign.id,
            action: 'update',
            userId: user.id,
            userRole: user.role,
            oldValues,
            newValues,
            ipAddress: request.ip(),
            userAgent: request.header('user-agent'),
          })
        }
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer la mise à jour si l'audit log échoue
      }

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_UPDATED, campaign)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.CAMPAIGN_OVERLAP) {
        return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_OVERLAP)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_UPDATE_FAILED)
    }
  }

  /**
   * Activate a campaign
   */
  async activate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.CAMPAIGN_NOT_AUTHORIZED)
      }

      const campaign = await this.campaignService.activate(params.id)

      // Enregistrer l'activation dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'Campaign',
          auditableId: campaign.id,
          action: 'activate',
          userId: user.id,
          userRole: user.role,
          oldValues: { status: 'inactive' },
          newValues: { status: 'active' },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer l'activation si l'audit log échoue
      }

      // Émettre un événement pour envoyer les notifications en arrière-plan
      // Cela ne bloquera pas la réponse HTTP et s'exécutera de manière complètement asynchrone
      emitter.emit('campaign:activated', {
        campaign,
        activatedBy: {
          id: user.id,
          username: user.username,
          fullName: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
        },
      })

      console.log(
        "📧 Événement campaign:activated émis - notifications en cours d'envoi en arrière-plan"
      )

      // Vérifier les magasins associés à la campagne et notifier les admins de bassin
      try {
        // Compter tous les magasins
        const totalStoresCount = await Store.query().whereNull('deleted_at').count('* as total')
        const totalStores = Number(totalStoresCount[0].$extras.total)

        // Compter les magasins associés à cette campagne
        const activeStoresCount = await Store.query()
          .whereNull('deleted_at')
          .whereHas('campaigns', (campaignsQuery) => {
            campaignsQuery.where('campaign_id', campaign.id)
          })
          .count('* as total')
        const activeStores = Number(activeStoresCount[0].$extras.total)

        // Calculer les magasins inactifs (non associés)
        const inactiveStores = totalStores - activeStores

        // Si des magasins ne sont pas associés, notifier les admins de bassin
        if (inactiveStores > 0) {
          emitter.emit('campaign:stores-status', {
            campaign: {
              id: campaign.id,
              code: campaign.code,
              startDate: campaign.startDate.toFormat('dd/MM/yyyy'),
              endDate: campaign.endDate.toFormat('dd/MM/yyyy'),
            },
            totalStores,
            activeStores,
            inactiveStores,
            activatedBy: {
              id: user.id,
              fullName: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
            },
          })

          console.log(
            `📧 Événement campaign:stores-status émis - ${inactiveStores} magasin(s) non associé(s)`
          )
        }
      } catch (storesCheckError) {
        // Ne pas faire échouer l'activation si la vérification des magasins échoue
        console.error(
          'Erreur lors de la vérification des magasins pour la campagne:',
          storesCheckError
        )
      }

      // Vérifier les conventions des OPAs et notifier chaque OPA individuellement
      try {
        // Récupérer tous les OPAs (producers) qui ont des conventions
        const opasWithConventions = await db
          .from('conventions')
          .whereNull('deleted_at')
          .select('producers_id')
          .groupBy('producers_id')

        for (const opaRow of opasWithConventions) {
          const opaId = opaRow.producers_id

          // Compter toutes les conventions de cet OPA
          const totalConventionsCount = await db
            .from('conventions')
            .where('producers_id', opaId)
            .whereNull('deleted_at')
            .count('* as total')
          const totalConventions = Number(totalConventionsCount[0].total)

          // Compter les conventions de cet OPA associées à cette campagne
          const activeConventionsCount = await db
            .from('conventions')
            .where('producers_id', opaId)
            .whereNull('deleted_at')
            .whereExists((query) => {
              query
                .from('convention_campaign')
                .whereRaw('convention_campaign.convention_id = conventions.id')
                .where('convention_campaign.campaign_id', campaign.id)
            })
            .count('* as total')
          const activeConventions = Number(activeConventionsCount[0].total)

          // Calculer les conventions inactives (non associées)
          const inactiveConventions = totalConventions - activeConventions

          // Si cet OPA a des conventions non associées, le notifier
          if (inactiveConventions > 0) {
            // Récupérer les infos de l'OPA
            const opa = await db.from('actors').where('id', opaId).first()

            if (opa) {
              emitter.emit('campaign:opa-conventions-status', {
                campaign: {
                  id: campaign.id,
                  code: campaign.code,
                  startDate: campaign.startDate.toFormat('dd/MM/yyyy'),
                  endDate: campaign.endDate.toFormat('dd/MM/yyyy'),
                },
                opa: {
                  id: opa.id,
                  fullName: `${opa.family_name || ''} ${opa.given_name || ''}`.trim(),
                },
                conventionsData: {
                  totalConventions,
                  activeConventions,
                  inactiveConventions,
                },
                activatedBy: {
                  id: user.id,
                  fullName:
                    `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
                },
              })

              console.log(
                `📧 Événement campaign:opa-conventions-status émis pour OPA ${opa.family_name || ''} ${opa.given_name || ''} - ${inactiveConventions} convention(s) non associée(s)`
              )
            }
          }
        }
      } catch (opaConventionsCheckError) {
        // Ne pas faire échouer l'activation si la vérification des conventions OPA échoue
        console.error(
          'Erreur lors de la vérification des conventions OPA pour la campagne:',
          opaConventionsCheckError
        )
      }

      // Vérifier les conventions des acheteurs/exportateurs et notifier chacun individuellement
      try {
        // Récupérer tous les acheteurs/exportateurs qui ont des conventions
        const buyersWithConventions = await db
          .from('conventions')
          .whereNull('deleted_at')
          .select('buyer_exporter_id')
          .groupBy('buyer_exporter_id')

        for (const buyerRow of buyersWithConventions) {
          const buyerId = buyerRow.buyer_exporter_id

          // Compter toutes les conventions de cet acheteur/exportateur
          const totalConventionsCount = await db
            .from('conventions')
            .where('buyer_exporter_id', buyerId)
            .whereNull('deleted_at')
            .count('* as total')
          const totalConventions = Number(totalConventionsCount[0].total)

          // Compter les conventions de cet acheteur/exportateur associées à cette campagne
          const activeConventionsCount = await db
            .from('conventions')
            .where('buyer_exporter_id', buyerId)
            .whereNull('deleted_at')
            .whereExists((query) => {
              query
                .from('convention_campaign')
                .whereRaw('convention_campaign.convention_id = conventions.id')
                .where('convention_campaign.campaign_id', campaign.id)
            })
            .count('* as total')
          const activeConventions = Number(activeConventionsCount[0].total)

          // Calculer les conventions inactives (non associées)
          const inactiveConventions = totalConventions - activeConventions

          // Si cet acheteur/exportateur a des conventions non associées, le notifier
          if (inactiveConventions > 0) {
            // Récupérer les infos de l'acheteur/exportateur
            const buyer = await db.from('actors').where('id', buyerId).first()

            if (buyer) {
              emitter.emit('campaign:buyer-conventions-status', {
                campaign: {
                  id: campaign.id,
                  code: campaign.code,
                  startDate: campaign.startDate.toFormat('dd/MM/yyyy'),
                  endDate: campaign.endDate.toFormat('dd/MM/yyyy'),
                },
                buyer: {
                  id: buyer.id,
                  fullName: `${buyer.family_name || ''} ${buyer.given_name || ''}`.trim(),
                  actorType: buyer.actor_type,
                },
                conventionsData: {
                  totalConventions,
                  activeConventions,
                  inactiveConventions,
                },
                activatedBy: {
                  id: user.id,
                  fullName:
                    `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
                },
              })

              console.log(
                `📧 Événement campaign:buyer-conventions-status émis pour acheteur/exportateur ${buyer.family_name || ''} ${buyer.given_name || ''} - ${inactiveConventions} convention(s) non associée(s)`
              )
            }
          }
        }
      } catch (buyerConventionsCheckError) {
        // Ne pas faire échouer l'activation si la vérification des conventions acheteur/exportateur échoue
        console.error(
          'Erreur lors de la vérification des conventions acheteur/exportateur pour la campagne:',
          buyerConventionsCheckError
        )
      }

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_ACTIVATED, campaign)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_ACTIVATION_FAILED)
    }
  }

  /**
   * Deactivate a campaign
   */
  async deactivate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.CAMPAIGN_NOT_AUTHORIZED)
      }

      const campaign = await this.campaignService.deactivate(params.id)

      // Enregistrer la désactivation dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'Campaign',
          auditableId: campaign.id,
          action: 'deactivate',
          userId: user.id,
          userRole: user.role,
          oldValues: { status: 'active' },
          newValues: { status: 'inactive' },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer la désactivation si l'audit log échoue
      }

      return ApiResponse.success(response, SuccessCodes.CAMPAIGN_DEACTIVATED, campaign)
    } catch (error) {
      if (error.code === ErrorCodes.CAMPAIGN_DEACTIVATION_NOT_ALLOWED) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.CAMPAIGN_DEACTIVATION_NOT_ALLOWED
        )
      }
      return ApiResponse.fromException(response, error, ErrorCodes.CAMPAIGN_DEACTIVATION_FAILED)
    }
  }
}
