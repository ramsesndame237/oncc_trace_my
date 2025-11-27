import type Parcel from '#models/parcel'
import ActorService from '#services/actor_service'
import ParcelService from '#services/parcel_service'
import { CreateActorData, UpdateActorData } from '#types/actor_types'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import {
  addBuyerToExporterValidator,
  addProducerToOpaValidator,
  createActorValidator,
  updateActorStatusValidator,
  updateActorValidator,
} from '#validators/actor_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

@inject()
export default class ActorsController {
  constructor(
    protected actorService: ActorService,
    protected parcelService: ParcelService
  ) {}

  /**
   * Display a list of actors
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const page = request.input('page', 1)
      // Support both 'limit' and 'per_page' for compatibility
      const limit = request.input('limit') || request.input('per_page', 20)
      const actorType = request.input('actorType')
      const status = request.input('status')
      const locationCode = request.input('locationCode')
      const search = request.input('search')

      const actors = await this.actorService.list({
        page,
        limit,
        actorType,
        status,
        locationCode,
        search,
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
      })

      // Sérialiser les acteurs avec leurs relations
      const serializedActors = actors.serialize()

      // Transformer les exportateurs en mandators pour les acheteurs
      if (actorType === 'BUYER' && serializedActors.data) {
        // Accéder aux modèles originaux pour extraire les données pivot
        const actorModels = actors.all()

        serializedActors.data = serializedActors.data.map((actorData: any, index: number) => {
          const actorModel = actorModels[index]

          // Extraire les données pivot des exportateurs avant sérialisation
          if (actorModel?.exporters && actorModel.exporters.length > 0) {
            actorData.mandators = actorModel.exporters.map((exporter: any) => ({
              id: exporter.id,
              familyName: exporter.familyName,
              givenName: exporter.givenName,
              onccId: exporter.onccId,
              mandateDate: exporter.$extras?.pivot_mandate_date || null,
              status: exporter.$extras?.pivot_status || 'active',
              campaignId: exporter.$extras?.pivot_campaign_id || null,
            }))
          }

          // Supprimer les exporters de la réponse
          delete actorData.exporters
          return actorData
        })
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, serializedActors)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations - les field_agent peuvent aussi créer des acteurs
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        user.role !== 'field_agent'
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Valider les données avec le validator standard AdonisJS
      const payload = await request.validateUsing(createActorValidator)

      // Pour les producteurs, les parcelles sont obligatoires
      if (payload.actorType === 'PRODUCER' && (!payload.parcels || payload.parcels.length === 0)) {
        return ApiResponse.error(
          response,
          ErrorCodes.PARCEL_REQUIRED_FOR_PRODUCER,
          400,
          'Un producteur doit avoir au moins une parcelle'
        )
      }

      // Pour les producteurs, valider les parcelles
      if (payload.actorType === 'PRODUCER' && payload.parcels && payload.parcels.length > 0) {
        // Convertir les dates en DateTime pour la validation
        const parcelsForValidation = payload.parcels.map((parcel) => ({
          ...parcel,
          parcelCreationDate: parcel.parcelCreationDate
            ? DateTime.fromJSDate(parcel.parcelCreationDate)
            : undefined,
        }))

        const validationResult =
          await this.parcelService.validateParcelsForProducer(parcelsForValidation)

        if (!validationResult.valid) {
          return ApiResponse.error(
            response,
            ErrorCodes.PARCEL_DUPLICATE_IDENTIFIERS,
            400,
            'Certaines parcelles utilisent des identifiants déjà existants',
            { parcelErrors: validationResult.errors }
          )
        }
      }

      const actorData: CreateActorData = {
        actorType: payload.actorType,
        familyName: payload.familyName,
        givenName: payload.givenName,
        phone: payload.phone,
        email: payload.email,
        onccId: payload.onccId,
        identifiantId: payload.identifiantId,
        locationCode: payload.locationCode,
        managerInfo: payload.managerInfo,
        status: payload.status,
        metadata: payload.metadata,
        existenceDeclarationDate: payload.existenceDeclarationDate
          ? DateTime.fromJSDate(payload.existenceDeclarationDate).toFormat('yyyy-MM-dd')
          : undefined,
        existenceDeclarationCode: payload.existenceDeclarationCode || undefined,
        existenceDeclarationYears: payload.existenceDeclarationYears || undefined,
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // 1. Créer l'acteur avec audit log intégré et userRole pour déterminer le statut
      const actor = await this.actorService.create(actorData, auditContext, user.role)

      // 2. Créer les parcelles si c'est un producteur et que des parcelles sont fournies
      let createdParcels: Parcel[] = []
      if (payload.actorType === 'PRODUCER' && payload.parcels && payload.parcels.length > 0) {
        try {
          const parcelsForCreation = payload.parcels.map((parcel) => ({
            ...parcel,
            parcelCreationDate: parcel.parcelCreationDate
              ? DateTime.fromJSDate(parcel.parcelCreationDate)
              : undefined,
          }))

          // Créer les parcelles avec audit logs intégrés
          const bulkResult = await this.parcelService.bulkCreateForProducer(
            actor.id,
            parcelsForCreation,
            auditContext
          )

          createdParcels = bulkResult.success

          // Si certaines parcelles ont échoué, logger les erreurs mais continuer
          if (bulkResult.errors.length > 0) {
            console.error("Certaines parcelles n'ont pas pu être créées:", bulkResult.errors)
          }
        } catch (parcelError) {
          console.error('Erreur lors de la création des parcelles:', parcelError)
          // On ne bloque pas la création de l'acteur même si les parcelles échouent
        }
      }

      // 3. Ajouter les producteurs si c'est un OPA et que des producteurs sont fournis
      let addedProducersCount = 0
      if (payload.actorType === 'PRODUCERS' && payload.producers && payload.producers.length > 0) {
        try {
          for (const producerData of payload.producers) {
            try {
              await this.actorService.addProducerToOpa(
                actor.id,
                producerData.producerId,
                {
                  membershipDate: producerData.membershipDate
                    ? DateTime.fromJSDate(producerData.membershipDate).toFormat('yyyy-MM-dd')
                    : undefined,
                  status: producerData.status,
                },
                auditContext
              )
              addedProducersCount++
            } catch (producerError) {
              console.error(
                `Erreur lors de l'ajout du producteur ${producerData.producerId}:`,
                producerError
              )
              // On continue même si l'ajout d'un producteur échoue
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout des producteurs:", error)
          // On ne bloque pas la création de l'acteur même si les producteurs échouent
        }
      }

      // 4. Ajouter les acheteurs mandataires si c'est un EXPORTER et que des buyers sont fournis
      let addedBuyersCount = 0
      if (payload.actorType === 'EXPORTER' && payload.buyers && payload.buyers.length > 0) {
        try {
          for (const buyerData of payload.buyers) {
            try {
              await this.actorService.addBuyerToExporter(
                actor.id,
                buyerData.buyerId,
                {
                  mandateDate: buyerData.mandateDate
                    ? DateTime.fromJSDate(buyerData.mandateDate).toFormat('yyyy-MM-dd')
                    : undefined,
                  status: buyerData.status,
                },
                auditContext
              )
              addedBuyersCount++
            } catch (buyerError) {
              console.error(
                `Erreur lors de l'ajout de l'acheteur ${buyerData.buyerId}:`,
                buyerError
              )
              // On continue même si l'ajout d'un acheteur échoue
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout des acheteurs mandataires:", error)
          // On ne bloque pas la création de l'acteur même si les acheteurs échouent
        }
      }

      // Recharger l'acteur avec toutes ses relations pour la réponse
      const actorWithRelations = await this.actorService.findById(actor.id)

      // Traiter les acheteurs mandataires (pour EXPORTER) avec données pivot
      const buyersData = actorWithRelations.buyers
        ? actorWithRelations.buyers.map((buyer) => ({
            id: buyer.id,
            familyName: buyer.familyName,
            givenName: buyer.givenName,
            phone: buyer.phone,
            email: buyer.email,
            onccId: buyer.onccId,
            identifiantId: buyer.identifiantId,
            status: buyer.status,
            mandateDate: buyer.$extras.pivot_mandate_date || null,
            pivotStatus: buyer.$extras.pivot_status || 'active',
            campaignId: buyer.$extras.pivot_campaign_id || null,
          }))
        : []

      // Traiter les producteurs membres (pour OPA) avec données pivot
      const producersData = actorWithRelations.producers
        ? actorWithRelations.producers.map((producer) => ({
            id: producer.id,
            familyName: producer.familyName,
            givenName: producer.givenName,
            phone: producer.phone,
            email: producer.email,
            onccId: producer.onccId,
            identifiantId: producer.identifiantId,
            status: producer.status,
            membershipDate: producer.$extras.pivot_membership_date || null,
            pivotStatus: producer.$extras.pivot_status || 'active',
          }))
        : []

      // Sérialiser explicitement le modèle de base (sans les relations many-to-many)
      const serializedActor = actorWithRelations.serialize({
        relations: {
          location: {
            fields: {
              pick: ['code', 'name', 'type', 'parentCode'],
            },
          },
        },
      })

      // Préparer la réponse avec toutes les données créées
      const responseData = {
        actor: {
          ...serializedActor,
          buyers: buyersData,
          producers: producersData,
        },
        parcels: createdParcels,
        summary: {
          parcelsCreated: createdParcels.length,
          producersAdded: addedProducersCount,
          buyersAdded: addedBuyersCount,
        },
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_CREATED, responseData, 201)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.ACTOR_ONCC_ID_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_ONCC_ID_EXISTS)
      }

      if (error.code === ErrorCodes.ACTOR_IDENTIFIANT_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_IDENTIFIANT_EXISTS)
      }

      if (error.code === ErrorCodes.ACTOR_MANAGER_INFO_REQUIRED) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_MANAGER_INFO_REQUIRED)
      }

      if (error.code === ErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED)
      }

      if (error.code === ErrorCodes.USER_CREATE_EMAIL_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_EMAIL_EXISTS)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_CREATION_FAILED)
    }
  }

  /**
   * Show individual actor
   */
  async show({ params, response }: HttpContext) {
    try {
      const actor = await this.actorService.findById(params.id)
      console.log('[DEBUG] show - Actor avant sérialisation:', {
        id: actor.id,
        actorType: actor.actorType,
        producersCount: actor.producers?.length || 0,
        buyersCount: actor.buyers?.length || 0,
        hasProducersRelation: !!actor.producers,
        hasBuyersRelation: !!actor.buyers,
      })

      // Traiter les acheteurs mandataires (pour EXPORTER) avec données pivot
      const buyersData = actor.buyers
        ? actor.buyers.map((buyer) => ({
            id: buyer.id,
            familyName: buyer.familyName,
            givenName: buyer.givenName,
            phone: buyer.phone,
            email: buyer.email,
            onccId: buyer.onccId,
            identifiantId: buyer.identifiantId,
            status: buyer.status,
            mandateDate: buyer.$extras.pivot_mandate_date || null,
            pivotStatus: buyer.$extras.pivot_status || 'active',
            campaignId: buyer.$extras.pivot_campaign_id || null,
          }))
        : []

      // Traiter les producteurs membres (pour OPA) avec données pivot
      const producersData = actor.producers
        ? actor.producers.map((producer) => ({
            id: producer.id,
            familyName: producer.familyName,
            givenName: producer.givenName,
            phone: producer.phone,
            email: producer.email,
            onccId: producer.onccId,
            identifiantId: producer.identifiantId,
            status: producer.status,
            membershipDate: producer.$extras.pivot_membership_date || null,
            pivotStatus: producer.$extras.pivot_status || 'active',
          }))
        : []

      // Sérialiser explicitement le modèle de base (sans les relations many-to-many)
      const serializedActor = actor.serialize({
        relations: {
          location: {
            fields: {
              pick: ['code', 'name', 'type', 'parentCode'],
            },
          },
        },
      })

      console.log('[DEBUG] show - Actor après sérialisation:', {
        hasProducers: producersData.length > 0,
        producersCount: producersData.length,
        hasBuyers: buyersData.length > 0,
        buyersCount: buyersData.length,
      })

      // Retourner l'acteur avec les relations traitées
      return ApiResponse.success(response, SuccessCodes.ACTOR_FETCH_SUCCESS, {
        ...serializedActor,
        buyers: buyersData,
        producers: producersData,
      })
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_FOUND)
    }
  }

  /**
   * Handle form submission for the update action
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(updateActorValidator)

      const updateData: UpdateActorData = {
        actorType: payload.actorType,
        familyName: payload.familyName,
        givenName: payload.givenName,
        phone: payload.phone,
        email: payload.email,
        onccId: payload.onccId,
        identifiantId: payload.identifiantId,
        locationCode: payload.locationCode,
        managerInfo: payload.managerInfo,
        metadata: payload.metadata,
        // Champs de déclaration d'existence
        existenceDeclarationDate:
          payload.existenceDeclarationDate === null
            ? undefined
            : payload.existenceDeclarationDate
              ? DateTime.fromJSDate(payload.existenceDeclarationDate).toFormat('yyyy-MM-dd')
              : undefined,
        existenceDeclarationCode:
          payload.existenceDeclarationCode === null ? undefined : payload.existenceDeclarationCode,
        existenceDeclarationYears:
          payload.existenceDeclarationYears === null
            ? undefined
            : payload.existenceDeclarationYears,
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Mettre à jour l'acteur avec audit log intégré
      const actor = await this.actorService.update(params.id, updateData, auditContext)

      return ApiResponse.success(response, SuccessCodes.ACTOR_UPDATED, actor)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'acteur:", error)
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.ACTOR_ONCC_ID_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_ONCC_ID_EXISTS)
      }

      if (error.code === ErrorCodes.ACTOR_IDENTIFIANT_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_IDENTIFIANT_EXISTS)
      }

      if (error.code === ErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_UPDATE_FAILED)
    }
  }

  /**
   * Activate an actor
   */
  async activate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Activer l'acteur avec audit log intégré
      const actor = await this.actorService.activate(params.id, auditContext)

      // Émettre un événement pour envoyer un email aux utilisateurs de l'acteur
      emitter.emit('actor:activated', {
        actorId: actor.id,
        actorName: `${actor.familyName} ${actor.givenName}`,
        actorType: actor.actorType,
      })

      return ApiResponse.success(response, SuccessCodes.ACTOR_ACTIVATED, actor)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_ACTIVATION_FAILED)
    }
  }

  /**
   * Deactivate an actor
   */
  async deactivate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Désactiver l'acteur avec audit log intégré
      const actor = await this.actorService.deactivate(params.id, auditContext)

      // Émettre un événement pour envoyer un email aux utilisateurs de l'acteur
      emitter.emit('actor:deactivated', {
        actorId: actor.id,
        actorName: `${actor.familyName} ${actor.givenName}`,
        actorType: actor.actorType,
      })

      return ApiResponse.success(response, SuccessCodes.ACTOR_DEACTIVATED, actor)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_DEACTIVATION_FAILED)
    }
  }

  /**
   * Change actor status (active, inactive)
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(updateActorStatusValidator)
      const existingActor = await this.actorService.findById(params.id)

      // Vérifier que le changement de statut est valide
      if (existingActor.status === payload.status) {
        const message =
          payload.status === 'active'
            ? 'déjà actif'
            : payload.status === 'inactive'
              ? 'déjà inactif'
              : 'déjà en brouillon'
        return ApiResponse.error(
          response,
          ErrorCodes.ACTOR_STATUS_UPDATE_FAILED,
          400,
          `L'acteur est ${message}.`
        )
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      let actor

      if (payload.status === 'active') {
        actor = await this.actorService.activate(params.id, auditContext)
      } else if (payload.status === 'inactive') {
        actor = await this.actorService.deactivate(params.id, auditContext)
      } else {
        return ApiResponse.error(
          response,
          ErrorCodes.ACTOR_STATUS_UPDATE_FAILED,
          400,
          "Statut d'acteur invalide."
        )
      }

      const successMessage =
        payload.status === 'active' ? SuccessCodes.ACTOR_ACTIVATED : SuccessCodes.ACTOR_DEACTIVATED

      return ApiResponse.success(response, successMessage, actor)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer l'erreur de documents manquants lors de la validation
      if (error.code === ErrorCodes.ACTOR_MISSING_REQUIRED_DOCUMENTS) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.ACTOR_MISSING_REQUIRED_DOCUMENTS
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_STATUS_UPDATE_FAILED)
    }
  }

  /**
   * Delete an actor (soft delete)
   */
  async destroy({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Supprimer l'acteur avec audit log intégré
      await this.actorService.delete(params.id, auditContext)

      return ApiResponse.success(response, SuccessCodes.ACTOR_DELETED, null)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_DELETION_FAILED)
    }
  }

  /**
   * Get actors by type
   */
  async getByType({ params, request, response }: HttpContext) {
    try {
      const { type } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')
      const search = request.input('search')

      const actors = await this.actorService.list({
        page,
        limit,
        actorType: type,
        status,
        search,
      })

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, actors.serialize())
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Add a producer to an OPA (single or bulk)
   */
  async addProducer({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const { opaId, producerId } = params

      // Vérifier les autorisations
      // basin_admin et technical_admin peuvent ajouter à n'importe quelle OPA
      // actor_manager peut ajouter uniquement à son propre OPA
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        user.role !== 'field_agent' &&
        !(user.role === 'actor_manager' && user.actorId === opaId)
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Valider les données
      const payload = await request.validateUsing(addProducerToOpaValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Vérifier si c'est un ajout en masse ou unique
      if (payload.producerIds && payload.producerIds.length > 0) {
        // Gestion en masse avec logique différentielle
        await this.actorService.manageOpaProducers(
          opaId,
          payload.producerIds,
          {
            membershipDate: payload.membershipDate
              ? DateTime.fromJSDate(payload.membershipDate).toFormat('yyyy-MM-dd')
              : undefined,
            status: payload.status,
          },
          auditContext
        )

        return ApiResponse.success(response, SuccessCodes.ACTOR_UPDATED, {
          opaId,
          producersCount: payload.producerIds.length,
        })
      } else if (producerId) {
        // Ajout unique
        await this.actorService.addProducerToOpa(
          opaId,
          producerId,
          {
            membershipDate: payload.membershipDate
              ? DateTime.fromJSDate(payload.membershipDate).toFormat('yyyy-MM-dd')
              : undefined,
            status: payload.status,
          },
          auditContext
        )

        // Récupérer les informations de l'OPA et du producteur pour l'événement
        const opa = await this.actorService.findById(opaId)
        const producer = await this.actorService.findById(producerId)

        // Émettre un événement pour envoyer un email aux utilisateurs de l'OPA
        emitter.emit('actor:producer-added-to-opa', {
          opaId: opa.id,
          opaName: `${opa.familyName} ${opa.givenName}`,
          producerId: producer.id,
          producerName: `${producer.familyName} ${producer.givenName}`,
        })

        return ApiResponse.success(response, SuccessCodes.PRODUCER_ADDED_TO_OPA, null)
      } else {
        return ApiResponse.serverError(
          response,
          ErrorCodes.ADD_PRODUCER_TO_OPA_FAILED,
          'Either producerId param or producerIds array must be provided'
        )
      }
    } catch (error) {
      // Gestion spécifique des erreurs métier
      if (error.code === ErrorCodes.ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_FOUND)
      }

      if (error.code === ErrorCodes.ACTOR_NOT_OPA) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_OPA)
      }

      if (error.code === ErrorCodes.ACTOR_NOT_PRODUCER) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_PRODUCER)
      }

      if (error.code === ErrorCodes.PRODUCER_ALREADY_IN_OPA) {
        return ApiResponse.fromException(response, error, ErrorCodes.PRODUCER_ALREADY_IN_OPA)
      }

      // Erreur générique par défaut
      return ApiResponse.fromException(response, error, ErrorCodes.ADD_PRODUCER_TO_OPA_FAILED)
    }
  }

  /**
   * Remove a producer from an OPA
   */
  async removeProducer({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const { opaId, producerId } = params

      // Vérifier les autorisations
      // basin_admin et technical_admin peuvent retirer de n'importe quelle OPA
      // actor_manager peut retirer uniquement de son propre OPA
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        !(user.role === 'actor_manager' && user.actorId === opaId)
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Récupérer les informations de l'OPA et du producteur AVANT le retrait
      const opa = await this.actorService.findById(opaId)
      const producer = await this.actorService.findById(producerId)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Retirer le producteur de l'OPA
      await this.actorService.removeProducerFromOpa(opaId, producerId, auditContext)

      // Émettre un événement pour envoyer un email aux utilisateurs de l'OPA
      emitter.emit('actor:producer-removed-from-opa', {
        opaId: opa.id,
        opaName: `${opa.familyName} ${opa.givenName}`,
        producerId: producer.id,
        producerName: `${producer.familyName} ${producer.givenName}`,
      })

      return ApiResponse.success(response, SuccessCodes.PRODUCER_REMOVED_FROM_OPA, null)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.REMOVE_PRODUCER_FROM_OPA_FAILED)
    }
  }

  /**
   * Get OPAs for a producer
   */
  async getProducerOpas({ params, request, response }: HttpContext) {
    try {
      const { producerId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Récupérer les OPA du producteur avec pagination
      const opasData = await this.actorService.getOPAsForProducer(producerId, { page, limit })

      // Sérialiser les OPA avec les données du pivot
      const serializedData = {
        meta: opasData.getMeta(),
        data: opasData.all().map((opa: any) => ({
          id: opa.id,
          actorType: opa.actor_type,
          familyName: opa.family_name,
          givenName: opa.given_name,
          phone: opa.phone,
          email: opa.email,
          onccId: opa.oncc_id,
          identifiantId: opa.identifiant_id,
          locationCode: opa.location_code,
          status: opa.status,
          membershipDate: opa.pivot_membership_date,
          membershipStatus: opa.pivot_status,
        })),
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, serializedData)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Get producers for an OPA
   */
  async getOpaProducers({ params, request, response }: HttpContext) {
    try {
      const { opaId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Récupérer les producteurs de l'OPA avec pagination
      const producersData = await this.actorService.getProducersForOPA(opaId, { page, limit })

      // Sérialiser les producteurs avec les données du pivot
      const serializedData = {
        meta: producersData.getMeta(),
        data: producersData.all().map((producer: any) => ({
          id: producer.id,
          actorType: producer.actor_type,
          familyName: producer.family_name,
          givenName: producer.given_name,
          phone: producer.phone,
          email: producer.email,
          onccId: producer.oncc_id,
          identifiantId: producer.identifiant_id,
          locationCode: producer.location_code,
          status: producer.status,
          membershipDate: producer.pivot_membership_date,
          membershipStatus: producer.pivot_status,
        })),
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, serializedData)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Get exporters for a buyer (for the active campaign)
   */
  async getBuyerExporters({ params, request, response }: HttpContext) {
    try {
      const { buyerId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Récupérer les exportateurs de l'acheteur pour la campagne active avec pagination
      const exportersData = await this.actorService.getExportersForBuyer(buyerId, { page, limit })

      // Sérialiser les exportateurs avec les données du pivot
      const serializedData = {
        meta: exportersData.getMeta(),
        data: exportersData.all().map((exporter: any) => ({
          id: exporter.id,
          actorType: exporter.actor_type,
          familyName: exporter.family_name,
          givenName: exporter.given_name,
          phone: exporter.phone,
          email: exporter.email,
          onccId: exporter.oncc_id,
          identifiantId: exporter.identifiant_id,
          locationCode: exporter.location_code,
          status: exporter.status,
          mandateDate: exporter.pivot_mandate_date,
          mandateStatus: exporter.pivot_status,
          campaignId: exporter.pivot_campaign_id,
        })),
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, serializedData)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Get buyers for an exporter (for the active campaign)
   */
  async getExporterBuyers({ params, request, response }: HttpContext) {
    try {
      const { exporterId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Récupérer les acheteurs de l'exportateur pour la campagne active avec pagination
      const buyersData = await this.actorService.getBuyersForExporter(exporterId, { page, limit })

      // Sérialiser les acheteurs avec les données du pivot
      const serializedData = {
        meta: buyersData.getMeta(),
        data: buyersData.all().map((buyer: any) => ({
          id: buyer.id,
          actorType: buyer.actor_type,
          familyName: buyer.family_name,
          givenName: buyer.given_name,
          phone: buyer.phone,
          email: buyer.email,
          onccId: buyer.oncc_id,
          identifiantId: buyer.identifiant_id,
          locationCode: buyer.location_code,
          status: buyer.status,
          mandateDate: buyer.pivot_mandate_date,
          mandateStatus: buyer.pivot_status,
          campaignId: buyer.pivot_campaign_id,
        })),
      }

      return ApiResponse.success(response, SuccessCodes.ACTOR_LIST_SUCCESS, serializedData)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Add a buyer to an exporter
   * Supports both single and bulk addition
   */
  async addBuyer({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const { exporterId, buyerId } = params

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      // Valider les données
      const payload = await request.validateUsing(addBuyerToExporterValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Vérifier si c'est un ajout en masse ou unique
      if (payload.buyerIds && payload.buyerIds.length > 0) {
        // Gestion en masse avec logique différentielle
        await this.actorService.manageExporterBuyers(
          exporterId,
          payload.buyerIds,
          {
            mandateDate: payload.mandateDate
              ? DateTime.fromJSDate(payload.mandateDate).toFormat('yyyy-MM-dd')
              : undefined,
            status: payload.status,
          },
          auditContext
        )

        return ApiResponse.success(response, SuccessCodes.ACTOR_UPDATED, {
          exporterId,
          buyersCount: payload.buyerIds.length,
        })
      } else if (buyerId) {
        // Ajout unique
        await this.actorService.addBuyerToExporter(
          exporterId,
          buyerId,
          {
            mandateDate: payload.mandateDate
              ? DateTime.fromJSDate(payload.mandateDate).toFormat('yyyy-MM-dd')
              : undefined,
            status: payload.status,
          },
          auditContext
        )

        // Récupérer les informations de l'exportateur et du buyer pour les événements
        const exporter = await this.actorService.findById(exporterId)
        const buyer = await this.actorService.findById(buyerId)

        // Émettre les événements de notification
        // 1. Notifier les utilisateurs de l'exportateur
        emitter.emit('actor:buyer-added-to-exporter', {
          exporterId: exporter.id,
          exporterName: `${exporter.familyName} ${exporter.givenName}`,
          buyerId: buyer.id,
          buyerName: `${buyer.familyName} ${buyer.givenName}`,
        })

        // 2. Notifier les utilisateurs du buyer mandataire
        emitter.emit('actor:buyer-assigned-as-mandataire', {
          buyerId: buyer.id,
          buyerName: `${buyer.familyName} ${buyer.givenName}`,
          exporterId: exporter.id,
          exporterName: `${exporter.familyName} ${exporter.givenName}`,
        })

        return ApiResponse.success(response, SuccessCodes.BUYER_ADDED_TO_EXPORTER, null)
      } else {
        return ApiResponse.serverError(
          response,
          ErrorCodes.ADD_BUYER_TO_EXPORTER_FAILED,
          'Either buyerId param or buyerIds array must be provided'
        )
      }
    } catch (error) {
      // Gestion spécifique des erreurs métier
      if (error.code === ErrorCodes.ACTOR_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_FOUND)
      }

      if (error.code === ErrorCodes.ACTOR_NOT_EXPORTER) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_EXPORTER)
      }

      if (error.code === ErrorCodes.ACTOR_NOT_BUYER) {
        return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_NOT_BUYER)
      }

      if (error.code === ErrorCodes.BUYER_ALREADY_IN_EXPORTER) {
        return ApiResponse.fromException(response, error, ErrorCodes.BUYER_ALREADY_IN_EXPORTER)
      }

      if (error.code === ErrorCodes.BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.ADD_BUYER_TO_EXPORTER_FAILED)
    }
  }

  /**
   * Remove a buyer from an exporter
   */
  async removeBuyer({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      }

      const { exporterId, buyerId } = params

      // Récupérer les informations de l'exportateur et du buyer AVANT le retrait
      const exporter = await this.actorService.findById(exporterId)
      const buyer = await this.actorService.findById(buyerId)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Retirer l'acheteur de l'exportateur
      await this.actorService.removeBuyerFromExporter(exporterId, buyerId, auditContext)

      // Émettre les événements de notification
      // 1. Notifier les utilisateurs de l'exportateur
      emitter.emit('actor:buyer-removed-from-exporter', {
        exporterId: exporter.id,
        exporterName: `${exporter.familyName} ${exporter.givenName}`,
        buyerId: buyer.id,
        buyerName: `${buyer.familyName} ${buyer.givenName}`,
      })

      // 2. Notifier les utilisateurs du buyer mandataire
      emitter.emit('actor:buyer-unassigned-as-mandataire', {
        buyerId: buyer.id,
        buyerName: `${buyer.familyName} ${buyer.givenName}`,
        exporterId: exporter.id,
        exporterName: `${exporter.familyName} ${exporter.givenName}`,
      })

      return ApiResponse.success(response, SuccessCodes.BUYER_REMOVED_FROM_EXPORTER, null)
    } catch (error) {
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.REMOVE_BUYER_FROM_EXPORTER_FAILED
      )
    }
  }

  /**
   * Sync all actors - Initial sync for offline mobile clients
   * Returns all actors without pagination for basin_admin and field_agent
   * GET /actors/sync/all?actor_type=PRODUCER or ?actor_type[]=PRODUCER&actor_type[]=BUYER
   */
  async syncAll({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations - Seulement basin_admin et field_agent
      // if (user.role !== 'basin_admin' && user.role !== 'field_agent') {
      //   return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      // }

      // Récupérer le paramètre actor_type (peut être un string ou un tableau)
      let actorTypes: string[] | undefined
      const actorTypeParam = request.input('actor_type')

      if (actorTypeParam) {
        // Si c'est déjà un tableau, l'utiliser directement
        if (Array.isArray(actorTypeParam)) {
          actorTypes = actorTypeParam
        } else {
          // Si c'est un string, le convertir en tableau
          actorTypes = [actorTypeParam]
        }
      }

      console.log(
        `🔄 Sync initiale des acteurs demandée par ${user.username} (${user.role})${
          actorTypes ? ` - Filtré par type(s): ${actorTypes.join(', ')}` : ''
        }`
      )

      // Récupérer tous les acteurs pour cet utilisateur
      const actors = await this.actorService.getAllForSync({
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
        actorTypes,
      })

      console.log(`✅ ${actors.length} acteur(s) renvoyé(s) pour la sync initiale`)

      return ApiResponse.success(response, SuccessCodes.ACTOR_SYNC_SUCCESS, {
        actors,
        total: actors.length,
        syncedAt: Date.now(),
      })
    } catch (error) {
      console.error('Erreur lors de la sync initiale des acteurs:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_SYNC_FAILED)
    }
  }

  /**
   * Sync updated actors - Incremental sync for offline mobile clients
   * Returns only actors modified since the given timestamp
   * GET /actors/sync/updates?since=timestamp
   */
  async syncUpdates({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations - Seulement basin_admin et field_agent
      // if (user.role !== 'basin_admin' && user.role !== 'field_agent') {
      //   return ApiResponse.forbiddenError(response, ErrorCodes.ACTOR_NOT_AUTHORIZED)
      // }

      const since = request.input('since')

      if (!since) {
        return ApiResponse.error(
          response,
          ErrorCodes.ACTOR_SYNC_FAILED,
          400,
          'Le paramètre "since" (timestamp) est requis'
        )
      }

      const sinceTimestamp = Number.parseInt(since, 10)

      if (Number.isNaN(sinceTimestamp) || sinceTimestamp <= 0) {
        return ApiResponse.error(
          response,
          ErrorCodes.ACTOR_SYNC_FAILED,
          400,
          'Le paramètre "since" doit être un timestamp valide'
        )
      }

      const sinceDate = new Date(sinceTimestamp)

      console.log(
        `🔄 Sync incrémentale des acteurs depuis ${sinceDate.toISOString()} demandée par ${user.username} (${user.role})`
      )

      // Récupérer les acteurs modifiés depuis la date donnée
      const actors = await this.actorService.getUpdatedSince({
        since: sinceDate,
        userRole: user.role,
        userProductionBasinId: user.productionBasinId || undefined,
      })

      console.log(`✅ ${actors.length} acteur(s) modifié(s) renvoyé(s) pour la sync incrémentale`)

      return ApiResponse.success(response, SuccessCodes.ACTOR_SYNC_SUCCESS, {
        actors,
        total: actors.length,
        since: sinceTimestamp,
        syncedAt: Date.now(),
      })
    } catch (error) {
      console.error('Erreur lors de la sync incrémentale des acteurs:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_SYNC_FAILED)
    }
  }

  /**
   * Get production quantities for a producer
   * GET /actors/:producerId/productions?opaId=xxx&campaignId=xxx
   */
  async getProducerProductions({ params, request, response }: HttpContext) {
    try {
      const { producerId } = params
      const opaId = request.input('opaId')
      const campaignId = request.input('campaignId')

      // Récupérer les productions du producteur
      const result = await this.actorService.getProducerProductionQuantities(producerId, {
        opaId,
        campaignId,
      })

      return ApiResponse.success(response, SuccessCodes.ACTOR_FETCH_SUCCESS, result)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }

  /**
   * Get collections for an OPA
   * GET /opas/:opaId/collections?campaignId=xxx
   */
  async getOpaCollections({ params, request, response }: HttpContext) {
    try {
      const { opaId } = params
      const campaignId = request.input('campaignId')

      // Récupérer les collectes de l'OPA
      const result = await this.actorService.getOpaCollections(opaId, {
        campaignId,
      })

      return ApiResponse.success(response, SuccessCodes.ACTOR_FETCH_SUCCESS, result)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.ACTOR_LIST_FAILED)
    }
  }
}
