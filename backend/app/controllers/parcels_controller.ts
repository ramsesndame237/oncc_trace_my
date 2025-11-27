import ParcelService from '#services/parcel_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { CreateParcelData, ParcelFilterOptions, UpdateParcelData } from '#types/parcel_types'
import { ApiResponse } from '#utils/api_response'
import {
  bulkCreateParcelForProducerValidator,
  createParcelValidator,
  parcelFilterValidator,
  updateParcelStatusValidator,
  updateParcelValidator,
} from '#validators/parcel_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

@inject()
export default class ParcelsController {
  constructor(protected parcelService: ParcelService) {}

  /**
   * Display a list of parcels
   */
  async index({ request, response }: HttpContext) {
    try {
      const filters = await request.validateUsing(parcelFilterValidator)
      const options: ParcelFilterOptions = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        producerId: filters.producerId,
        locationCode: filters.locationCode,
        parcelType: filters.parcelType,
        status: filters.status,
        search: filters.search,
      }

      const parcels = await this.parcelService.list(options)
      return ApiResponse.success(response, SuccessCodes.PARCEL_LIST_SUCCESS, parcels.serialize())
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_LIST_FAILED)
    }
  }

  /**
   * Handle form submission for creating a new parcel
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        user.role !== 'field_agent'
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(createParcelValidator)
      const parcelData: CreateParcelData = {
        producerId: payload.producerId,
        locationCode: payload.locationCode,
        surfaceArea: payload.surfaceArea,
        parcelCreationDate: payload.parcelCreationDate
          ? DateTime.fromJSDate(payload.parcelCreationDate)
          : undefined,
        parcelType: payload.parcelType,
        identificationId: payload.identificationId,
        onccId: payload.onccId,
        coordinates: payload.coordinates,
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Créer la parcelle avec audit log intégré
      const parcel = await this.parcelService.create(parcelData, auditContext)

      return ApiResponse.success(response, SuccessCodes.PARCEL_CREATED, parcel, 201)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_CREATION_FAILED)
    }
  }

  /**
   * Show individual parcel
   */
  async show({ params, response }: HttpContext) {
    try {
      const parcel = await this.parcelService.findById(params.id)
      return ApiResponse.success(response, SuccessCodes.PARCEL_FETCH_SUCCESS, parcel)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_NOT_FOUND)
    }
  }

  /**
   * Handle form submission for updating a parcel
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        user.role !== 'field_agent'
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(updateParcelValidator)

      // Convertir les chaînes vides en null pour permettre la suppression des valeurs
      const updateData: UpdateParcelData = {
        locationCode: payload.locationCode,
        surfaceArea: payload.surfaceArea,
        parcelCreationDate: payload.parcelCreationDate
          ? DateTime.fromJSDate(payload.parcelCreationDate)
          : undefined,
        parcelType: payload.parcelType,
        identificationId: payload.identificationId === '' ? null : payload.identificationId,
        onccId: payload.onccId === '' ? null : payload.onccId,
        coordinates: payload.coordinates,
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Mettre à jour la parcelle avec audit log intégré
      const parcel = await this.parcelService.update(params.id, updateData, auditContext)

      return ApiResponse.success(response, SuccessCodes.PARCEL_UPDATED, parcel)
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques d'unicité
      if (error.code === ErrorCodes.PARCEL_ONCC_ID_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_ONCC_ID_EXISTS, 409)
      }

      if (error.code === ErrorCodes.PARCEL_IDENTIFICATION_ID_EXISTS) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.PARCEL_IDENTIFICATION_ID_EXISTS,
          409
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_UPDATE_FAILED)
    }
  }

  /**
   * Delete a parcel (soft delete)
   */
  async destroy({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Supprimer la parcelle avec audit log intégré
      await this.parcelService.delete(params.id, auditContext)

      return ApiResponse.success(response, SuccessCodes.PARCEL_DELETED, null)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_DELETION_FAILED)
    }
  }

  /**
   * Get parcels by producer
   */
  async getByProducer({ params, response }: HttpContext) {
    try {
      const parcels = await this.parcelService.getByProducer(params.producerId)
      return ApiResponse.success(response, SuccessCodes.PARCEL_LIST_SUCCESS, parcels)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_LIST_FAILED)
    }
  }

  /**
   * Get parcel statistics
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await this.parcelService.getStats()
      return ApiResponse.success(response, SuccessCodes.PARCEL_STATS_SUCCESS, stats)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_STATS_FAILED)
    }
  }

  /**
   * Create multiple parcels for a specific producer
   */
  async bulkStore({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (
        user.role !== 'basin_admin' &&
        user.role !== 'technical_admin' &&
        user.role !== 'field_agent'
      ) {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(bulkCreateParcelForProducerValidator)

      // Convertir les dates pour la validation
      const parcelsForValidation = payload.parcels.map((parcel) => ({
        ...parcel,
        parcelCreationDate: parcel.parcelCreationDate
          ? DateTime.fromJSDate(parcel.parcelCreationDate)
          : undefined,
      }))

      // Valider les parcelles avant la création
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

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Créer les parcelles avec audit logs intégrés
      const result = await this.parcelService.bulkCreateForProducer(
        params.producerId,
        parcelsForValidation,
        auditContext
      )

      return ApiResponse.success(response, SuccessCodes.PARCEL_CREATED, result, 201)
    } catch (error) {
      console.log('error', error)
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_CREATION_FAILED)
    }
  }

  /**
   * Activate a parcel
   */
  async activate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Activer la parcelle avec audit log intégré
      const parcel = await this.parcelService.activate(params.id, auditContext)

      return ApiResponse.success(response, SuccessCodes.PARCEL_ACTIVATED, parcel)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_ACTIVATION_FAILED)
    }
  }

  /**
   * Deactivate a parcel
   */
  async deactivate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Désactiver la parcelle avec audit log intégré
      const parcel = await this.parcelService.deactivate(params.id, auditContext)

      return ApiResponse.success(response, SuccessCodes.PARCEL_DEACTIVATED, parcel)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_DEACTIVATION_FAILED)
    }
  }

  /**
   * Change parcel status (activate or deactivate)
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier les autorisations
      if (user.role !== 'basin_admin' && user.role !== 'technical_admin') {
        return ApiResponse.forbiddenError(response, ErrorCodes.PARCEL_NOT_AUTHORIZED)
      }

      const payload = await request.validateUsing(updateParcelStatusValidator)

      if (payload.status === 'active') {
        return this.activate({ params, request, response, auth } as HttpContext)
      } else {
        return this.deactivate({ params, request, response, auth } as HttpContext)
      }
    } catch (error) {
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }
      return ApiResponse.fromException(response, error, ErrorCodes.PARCEL_UPDATE_FAILED)
    }
  }
}
