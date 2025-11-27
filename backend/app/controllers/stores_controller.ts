import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Store from '#models/store'
import ProductionBasinService from '#services/production_basin_service'
import StoreService from '#services/store_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { createStoreValidator, updateStoreValidator } from '#validators/store_validator'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

@inject()
export default class StoresController {
  constructor(
    protected storeService: StoreService,
    protected productionBasinService: ProductionBasinService
  ) {}
  /**
   * Liste des magasins avec recherche et pagination
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      const user = auth.use('api').user!

      // Paramètres de pagination
      const page = request.input('page', 1)
      const limit = Math.min(request.input('limit', 20), 100) // Limiter à 100 max

      // Paramètres de recherche
      const search = request.input('search', '').trim()
      const status = request.input('status')

      // Récupérer la campagne active
      const activeCampaign = await Campaign.getActiveCampaign()

      const query = Store.query()

      // ⭐ Si l'utilisateur est un actor_manager, filtrer par son acteur
      if (user.role === 'actor_manager' && user.actorId) {
        const userActorId = user.actorId
        query.whereHas('occupants', (occupantsQuery) => {
          occupantsQuery.where('actors.id', userActorId)
        })
      }

      // ⭐ Si l'utilisateur est basin_admin ou field_agent, filtrer par bassin de production
      if ((user.role === 'basin_admin' || user.role === 'field_agent') && user.productionBasinId) {
        try {
          // Récupérer les locationCodes du bassin avec propagation hiérarchique
          const basinLocationCodes =
            await this.productionBasinService.getLocationCodesWithPropagation(
              user.productionBasinId
            )

          if (basinLocationCodes.length > 0) {
            // Filtrer les magasins dont la localisation est dans le bassin
            query.whereIn('location_code', basinLocationCodes)
          } else {
            // Si le bassin n'a aucune location, ne retourner aucun résultat
            query.whereRaw('1 = 0')
          }
        } catch (error) {
          // En cas d'erreur, ne retourner aucun résultat
          query.whereRaw('1 = 0')
        }
      }

      // Filtrage par recherche (nom ou code)
      if (search) {
        query.where((builder) => {
          builder.whereILike('name', `%${search}%`).orWhereILike('code', `%${search}%`)
        })
      }

      // Filtrage par statut basé sur l'association avec la campagne active
      if (status && ['active', 'inactive'].includes(status) && activeCampaign) {
        if (status === 'active') {
          // Filtrer pour récupérer uniquement les magasins associés à la campagne active
          query.whereHas('campaigns', (campaignQuery) => {
            campaignQuery.where('campaign_id', activeCampaign.id)
          })
        } else if (status === 'inactive') {
          // Filtrer pour récupérer uniquement les magasins NON associés à la campagne active
          query.whereDoesntHave('campaigns', (campaignQuery) => {
            campaignQuery.where('campaign_id', activeCampaign.id)
          })
        }
      }

      // Charger les relations, y compris les campagnes pour déterminer si le magasin est actif
      query.preload('campaigns')
      // query.preload('location')
      // query.preload('occupants', (occupantsQuery) => {
      //   occupantsQuery.preload('location')
      // })

      // Ordre et pagination
      query.orderBy('created_at', 'desc')
      const stores = await query.paginate(page, limit)

      // Modifier le statut basé sur la liaison avec la campagne active
      const storesData = stores.serialize()
      storesData.data = storesData.data.map((store: any) => {
        const isActive = activeCampaign
          ? store.campaigns?.some((campaign: any) => campaign.id === activeCampaign.id) || false
          : false
        return {
          ...store,
          status: isActive ? 'active' : 'inactive',
        }
      })

      return ApiResponse.success(response, SuccessCodes.STORES_LIST_SUCCESS, storesData)
    } catch (error) {
      console.error('Error in StoresController.index:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORES_LIST_FAILED)
    }
  }

  /**
   * Récupère un magasin par son ID
   */
  async show({ request, response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      auth.use('api').user!

      const id = request.param('id')

      if (!id) {
        return ApiResponse.error(response, ErrorCodes.STORE_ID_REQUIRED, 400)
      }

      // Récupérer la campagne active
      const activeCampaign = await Campaign.getActiveCampaign()

      const store = await Store.query()
        .where('id', id)
        .preload('campaigns', (campaignQuery) => {
          campaignQuery.orderBy('startDate', 'desc')
        })
        // .preload('location')
        .preload('occupants')
        // .preload('auditLogs', (auditQuery) => {
        //   auditQuery.orderBy('createdAt', 'desc').limit(10)
        // })
        .first()

      if (!store) {
        return ApiResponse.notFoundError(response, ErrorCodes.STORE_NOT_FOUND)
      }

      // Sérialiser explicitement avec les relations
      const storeData = store.serialize({
        relations: {
          campaigns: {
            fields: ['id', 'name', 'startDate', 'endDate'],
          },
          occupants: {
            fields: {
              pick: [
                'id',
                'actorType',
                'familyName',
                'givenName',
                'phone',
                'email',
                'onccId',
                'identifiantId',
                'locationCode',
                'status',
              ],
            },
          },
        },
      })

      // Modifier le statut basé sur la liaison avec la campagne active
      const isActive = activeCampaign
        ? store.campaigns?.some((campaign) => campaign.id === activeCampaign.id) || false
        : false
      storeData.status = isActive ? 'active' : 'inactive'

      return ApiResponse.success(response, SuccessCodes.STORE_DETAILS_SUCCESS, storeData)
    } catch (error) {
      console.error('Error in StoresController.show:', error)

      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.STORE_NOT_FOUND)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.STORE_DETAILS_FAILED)
    }
  }

  /**
   * Crée un nouveau magasin
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      // Récupérer l'utilisateur authentifié
      const user = auth.use('api').user!

      // Validation des données
      const payload = await request.validateUsing(createStoreValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Créer le magasin via le service avec audit log intégré
      const store = await this.storeService.create(payload, auditContext)

      return ApiResponse.success(response, SuccessCodes.STORE_CREATED, store.serialize())
    } catch (error) {
      console.error('Error in StoresController.store:', error)

      // Gestion des erreurs de validation
      if (error.status === 422) {
        return ApiResponse.validationError(response, error.messages)
      }

      // Gestion de l'erreur de code de magasin existant
      if (error.code === ErrorCodes.STORE_CODE_EXISTS) {
        return ApiResponse.error(response, ErrorCodes.STORE_CODE_EXISTS, error.status || 409)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.STORE_CREATE_FAILED)
    }
  }

  /**
   * Met à jour un magasin
   */
  async update({ request, response, auth }: HttpContext) {
    try {
      const id = request.param('id')
      if (!id) {
        return ApiResponse.error(response, ErrorCodes.STORE_ID_REQUIRED, 400)
      }

      // Validation des données
      const payload = await request.validateUsing(updateStoreValidator)

      // Récupérer l'utilisateur authentifié
      const user = auth.use('api').user!

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Mettre à jour le magasin via le service avec audit log intégré
      const store = await this.storeService.update(id, payload, auditContext)

      return ApiResponse.success(response, SuccessCodes.STORE_UPDATED, store.serialize())
    } catch (error) {
      console.error('Error in StoresController.update:', error)

      // Gestion des erreurs de validation
      if (error.status === 422) {
        return ApiResponse.validationError(response, error.messages)
      }

      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.STORE_NOT_FOUND)
      }

      // Gestion de l'erreur de code de magasin existant
      if (error.code === ErrorCodes.STORE_CODE_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.STORE_CODE_EXISTS)
      }

      if (error.code === ErrorCodes.LOCATION_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.LOCATION_NOT_FOUND)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.STORE_UPDATE_FAILED)
    }
  }

  /**
   * Statistiques des magasins
   */
  async stats({ response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      auth.use('api').user!

      // Récupérer la campagne active
      const activeCampaign = await Campaign.getActiveCampaign()

      const totalStores = await Store.query().count('* as total')

      // Compter les magasins actifs (associés à la campagne active)
      const activeStoresCount = activeCampaign
        ? await Store.query()
            .join('store_campaigns', 'stores.id', 'store_campaigns.store_id')
            .where('store_campaigns.campaign_id', activeCampaign.id)
            .count('* as total')
        : [{ $extras: { total: 0 } }]

      const total = totalStores[0].$extras.total
      const active = activeStoresCount[0].$extras.total

      const stats = {
        total: total,
        active: active,
        inactive: total - active,
      }

      return ApiResponse.success(response, SuccessCodes.STORE_STATS_SUCCESS, stats)
    } catch (error) {
      console.error('Error in StoresController.stats:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_STATS_FAILED)
    }
  }

  /**
   * Active un magasin en l'associant à la campagne en cours
   */
  async activate({ request, response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      auth.use('api').user!

      const id = request.param('id')
      if (!id) {
        return ApiResponse.error(response, ErrorCodes.STORE_ID_REQUIRED, 400)
      }

      // Récupérer le magasin
      const store = await Store.find(id)
      if (!store) {
        return ApiResponse.notFoundError(response, ErrorCodes.STORE_NOT_FOUND)
      }

      // Récupérer la campagne active
      const activeCampaign = await Campaign.getActiveCampaign()
      if (!activeCampaign) {
        return ApiResponse.error(response, ErrorCodes.CAMPAIGN_NO_ACTIVE, 400)
      }

      // Charger les campagnes du magasin
      await store.load('campaigns')

      // Vérifier si le magasin n'est pas déjà associé à la campagne
      const isAlreadyActive = store.campaigns.some((campaign) => campaign.id === activeCampaign.id)
      if (isAlreadyActive) {
        return ApiResponse.error(response, ErrorCodes.STORE_ALREADY_ACTIVE, 400)
      }

      // Récupérer l'utilisateur authentifié
      const user = auth.use('api').user!

      // Associer le magasin à la campagne active
      await store.related('campaigns').attach({
        [activeCampaign.id]: {
          validation_date: new Date(),
        },
      })

      // Enregistrer l'activation dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'Store',
          auditableId: store.id,
          action: 'activate',
          userId: user.id,
          userRole: user.role,
          oldValues: {
            status: 'inactive',
            campaignId: null,
          },
          newValues: {
            status: 'active',
            campaignId: activeCampaign.id,
            campaignCode: activeCampaign.code,
          },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer l'activation si l'audit log échoue
      }

      // Recharger les campagnes pour la réponse
      await store.load('campaigns', (query) => {
        query.orderBy('startDate', 'desc')
      })

      // Préparer la réponse avec le statut mis à jour
      const storeData = store.serialize()
      storeData.status = 'active'

      // Émettre l'événement d'activation de magasin (asynchrone, en arrière-plan)
      emitter.emit('store:activated', {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
          storeType: store.storeType,
        },
        campaign: {
          id: activeCampaign.id,
          code: activeCampaign.code,
          startDate: activeCampaign.startDate.toISODate() || '',
          endDate: activeCampaign.endDate.toISODate() || '',
        },
        activatedBy: {
          id: user.id,
          username: user.username,
          fullName: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
        },
      })

      return ApiResponse.success(response, SuccessCodes.STORE_ACTIVATED, storeData)
    } catch (error) {
      console.error('Error in StoresController.activate:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_ACTIVATION_FAILED)
    }
  }

  /**
   * Désactive un magasin en supprimant son association avec la campagne en cours
   */
  async deactivate({ request, response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      auth.use('api').user!

      const id = request.param('id')
      if (!id) {
        return ApiResponse.error(response, ErrorCodes.STORE_ID_REQUIRED, 400)
      }

      // Récupérer le magasin
      const store = await Store.find(id)
      if (!store) {
        return ApiResponse.notFoundError(response, ErrorCodes.STORE_NOT_FOUND)
      }

      // Récupérer la campagne active
      const activeCampaign = await Campaign.getActiveCampaign()
      if (!activeCampaign) {
        return ApiResponse.error(response, ErrorCodes.CAMPAIGN_NO_ACTIVE, 400)
      }

      // Charger les campagnes du magasin
      await store.load('campaigns')

      // Vérifier si le magasin est bien associé à la campagne
      const isActive = store.campaigns.some((campaign) => campaign.id === activeCampaign.id)
      if (!isActive) {
        return ApiResponse.error(response, ErrorCodes.STORE_ALREADY_INACTIVE, 400)
      }

      // Récupérer l'utilisateur authentifié
      const user = auth.use('api').user!

      // Dissocier le magasin de la campagne active
      await store.related('campaigns').detach([activeCampaign.id])

      // Enregistrer la désactivation dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'Store',
          auditableId: store.id,
          action: 'deactivate',
          userId: user.id,
          userRole: user.role,
          oldValues: {
            status: 'active',
            campaignId: activeCampaign.id,
            campaignCode: activeCampaign.code,
          },
          newValues: {
            status: 'inactive',
            campaignId: null,
          },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer la désactivation si l'audit log échoue
      }

      // Recharger les campagnes pour la réponse
      await store.load('campaigns', (query) => {
        query.orderBy('startDate', 'desc')
      })

      // Préparer la réponse avec le statut mis à jour
      const storeData = store.serialize()
      storeData.status = 'inactive'

      // Émettre l'événement de désactivation de magasin (asynchrone, en arrière-plan)
      emitter.emit('store:deactivated', {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
          storeType: store.storeType,
        },
        campaign: {
          id: activeCampaign.id,
          code: activeCampaign.code,
          startDate: activeCampaign.startDate.toISODate() || '',
          endDate: activeCampaign.endDate.toISODate() || '',
        },
        deactivatedBy: {
          id: user.id,
          username: user.username,
          fullName: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
        },
      })

      return ApiResponse.success(response, SuccessCodes.STORE_DEACTIVATED, storeData)
    } catch (error) {
      console.error('Error in StoresController.deactivate:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_DEACTIVATION_FAILED)
    }
  }

  /**
   * Ajouter un occupant à un magasin
   */
  async addOccupant({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.STORE_NOT_AUTHORIZED)
      }

      const { actorId } = request.only(['actorId'])

      if (!actorId) {
        return ApiResponse.validationError(response, [
          { field: 'actorId', message: 'actorId est requis' },
        ])
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      await this.storeService.addOccupant(params.id, actorId, auditContext)

      return ApiResponse.success(response, SuccessCodes.STORE_OCCUPANT_ADDED, {
        storeId: params.id,
        actorId,
      })
    } catch (error) {
      console.error('Error in StoresController.addOccupant:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_OCCUPANT_ADD_FAILED)
    }
  }

  /**
   * Retirer un occupant d'un magasin
   */
  async removeOccupant({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.STORE_NOT_AUTHORIZED)
      }

      const actorId = params.actorId

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      await this.storeService.removeOccupant(params.id, actorId, auditContext)

      return ApiResponse.success(response, SuccessCodes.STORE_OCCUPANT_REMOVED, {
        storeId: params.id,
        actorId,
      })
    } catch (error) {
      console.error('Error in StoresController.removeOccupant:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_OCCUPANT_REMOVE_FAILED)
    }
  }

  /**
   * Récupérer la liste des occupants d'un magasin
   */
  async getOccupants({ params, response, auth }: HttpContext) {
    try {
      // Vérification de l'authentification
      auth.use('api').user!

      const occupants = await this.storeService.getOccupants(params.id)

      return ApiResponse.success(response, SuccessCodes.STORE_OCCUPANTS_FETCH_SUCCESS, occupants)
    } catch (error) {
      console.error('Error in StoresController.getOccupants:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.STORE_OCCUPANTS_FETCH_FAILED)
    }
  }
}
