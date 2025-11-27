import AuditLog from '#models/audit_log'
import ProductionBasinService from '#services/production_basin_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ProductionBasinErrorCodes } from '#types/errors/production_basin'
import { ApiResponse } from '#utils/api_response'
import { assignUsersValidator } from '#validators/assign_users_validator'
import {
  createProductionBasinValidator,
  updateProductionBasinValidator,
} from '#validators/production_basin_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductionBasinsController {
  private productionBasinService: ProductionBasinService

  constructor() {
    this.productionBasinService = new ProductionBasinService()
  }

  /**
   * Récupérer tous les bassins de production avec pagination et filtres
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const search = request.input('search')
      const withLocations = request.input('with_locations', false)
      const withUsers = request.input('with_users', false)

      const basins = await this.productionBasinService.list({
        page,
        limit,
        search,
        withLocations,
        withUsers,
      })

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCTION_BASIN_LIST_SUCCESS,
        basins.serialize()
      )
    } catch (error) {
      console.error('Erreur récupération bassins:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_LIST_FAILED)
    }
  }

  /**
   * Récupérer un bassin de production spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const basin = await this.productionBasinService.findById(params.id)

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCTION_BASIN_LIST_SUCCESS,
        basin.serialize()
      )
    } catch (error) {
      if (error.code === ProductionBasinErrorCodes.NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.PRODUCTION_BASIN_NOT_FOUND)
      }

      console.error('Erreur récupération bassin:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_LIST_FAILED)
    }
  }

  /**
   * Créer un nouveau bassin de production
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      // Validation des données
      const payload = await request.validateUsing(createProductionBasinValidator)

      // Vérifier que l'utilisateur a les droits (admin technique ou admin bassin)
      const user = auth.user!
      if (!['technical_admin', 'basin_admin'].includes(user.role)) {
        return ApiResponse.forbiddenError(
          response,
          ErrorCodes.PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED
        )
      }

      // Créer le bassin via le service avec validation des conflits
      const basin = await this.productionBasinService.create({
        name: payload.name,
        description: payload.description,
        locationCodes: payload.locationCodes,
      })

      // Enregistrer la création dans l'audit log
      try {
        await AuditLog.logAction({
          auditableType: 'ProductionBasin',
          auditableId: basin.id,
          action: 'create',
          userId: user.id,
          userRole: user.role,
          oldValues: null,
          newValues: {
            name: basin.name,
            description: basin.description,
            locationCodes: payload.locationCodes || [],
          },
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        // Ne pas faire échouer la création si l'audit log échoue
      }

      return ApiResponse.created(response, SuccessCodes.PRODUCTION_BASIN_CREATED, basin.serialize())
    } catch (error) {
      // Gérer les erreurs de validation VineJS
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les conflits de localisation spécifiquement
      if (error.code === ProductionBasinErrorCodes.LOCATION_CONFLICTS) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_LOCATION_CONFLICTS,
          409,
          error.message,
          { conflicts: (error as any).conflicts }
        )
      }

      // Gérer les conflits hiérarchiques région-département
      if (error.code === ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT,
          409,
          error.message,
          {
            regionConflicts: (error as any).hierarchicalResult?.regionConflicts || [],
            departmentConflicts: (error as any).hierarchicalResult?.departmentConflicts || [],
          }
        )
      }

      // Gérer les conflits hiérarchiques département-district (descendant)
      if (error.code === ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT,
          409,
          error.message,
          {
            regionConflicts: (error as any).hierarchicalResult?.regionConflicts || [],
            departmentConflicts: (error as any).hierarchicalResult?.departmentConflicts || [],
          }
        )
      }

      // Gérer les conflits district → département parent (ascendant)
      if (error.code === ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT,
          409,
          error.message,
          {
            districtParentConflicts: (error as any).hierarchicalResult?.districtParentConflicts || [],
          }
        )
      }

      // Gérer les conflits département → région parente (ascendant)
      if (error.code === ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT,
          409,
          error.message,
          {
            departmentParentConflicts: (error as any).hierarchicalResult?.departmentParentConflicts || [],
          }
        )
      }

      console.error('Erreur création bassin:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_CREATE_FAILED)
    }
  }

  /**
   * Mettre à jour un bassin de production
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      // Validation des données
      const payload = await request.validateUsing(updateProductionBasinValidator, {
        meta: { basinId: params.id },
      })

      // Vérifier que l'utilisateur a les droits
      const user = auth.user!
      if (!['technical_admin', 'basin_admin'].includes(user.role)) {
        return ApiResponse.forbiddenError(
          response,
          ErrorCodes.PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED
        )
      }

      // Récupérer le bassin existant pour l'audit log
      const existingBasin = await this.productionBasinService.findById(params.id)
      const originalValues = {
        name: existingBasin.name,
        description: existingBasin.description,
        // Récupérer les codes de localisation depuis les relations
        locationCodes: existingBasin.locations?.map((loc) => loc.code) || [],
      }

      // Mettre à jour le bassin via le service avec validation des conflits
      const basin = await this.productionBasinService.update(params.id, {
        name: payload.name,
        description: payload.description,
        locationCodes: payload.locationCodes,
      })

      // Enregistrer la modification dans l'audit log
      try {
        // Déterminer les champs modifiés
        const changedFields: Record<string, any> = {}
        const newValues: Record<string, any> = {}
        const oldValues: Record<string, any> = {}

        if (payload.name && payload.name !== originalValues.name) {
          changedFields.name = payload.name
          newValues.name = payload.name
          oldValues.name = originalValues.name
        }

        if (payload.description && payload.description !== originalValues.description) {
          changedFields.description = payload.description
          newValues.description = payload.description
          oldValues.description = originalValues.description
        }

        if (
          payload.locationCodes &&
          JSON.stringify(payload.locationCodes.sort()) !==
            JSON.stringify(originalValues.locationCodes.sort())
        ) {
          changedFields.locationCodes = payload.locationCodes
          newValues.locationCodes = payload.locationCodes
          oldValues.locationCodes = originalValues.locationCodes
        }

        // Enregistrer l'audit log seulement s'il y a des modifications
        if (Object.keys(changedFields).length > 0) {
          await AuditLog.logAction({
            auditableType: 'ProductionBasin',
            auditableId: basin.id,
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

      return ApiResponse.success(response, SuccessCodes.PRODUCTION_BASIN_UPDATED, basin.serialize())
    } catch (error) {
      // Gérer les erreurs de validation VineJS
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.code === ProductionBasinErrorCodes.NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.PRODUCTION_BASIN_NOT_FOUND)
      }

      // Gérer les conflits de localisation spécifiquement
      if (error.code === ProductionBasinErrorCodes.LOCATION_CONFLICTS) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_LOCATION_CONFLICTS,
          409,
          error.message,
          { conflicts: (error as any).conflicts }
        )
      }

      // Gérer les conflits hiérarchiques région-département
      if (error.code === ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT,
          409,
          error.message,
          {
            regionConflicts: (error as any).hierarchicalResult?.regionConflicts || [],
            departmentConflicts: (error as any).hierarchicalResult?.departmentConflicts || [],
          }
        )
      }

      // Gérer les conflits hiérarchiques département-district (descendant)
      if (error.code === ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT,
          409,
          error.message,
          {
            regionConflicts: (error as any).hierarchicalResult?.regionConflicts || [],
            departmentConflicts: (error as any).hierarchicalResult?.departmentConflicts || [],
          }
        )
      }

      // Gérer les conflits district → département parent (ascendant)
      if (error.code === ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT,
          409,
          error.message,
          {
            districtParentConflicts: (error as any).hierarchicalResult?.districtParentConflicts || [],
          }
        )
      }

      // Gérer les conflits département → région parente (ascendant)
      if (error.code === ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT) {
        return ApiResponse.error(
          response,
          ErrorCodes.PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT,
          409,
          error.message,
          {
            departmentParentConflicts: (error as any).hierarchicalResult?.departmentParentConflicts || [],
          }
        )
      }

      console.error('Erreur mise à jour bassin:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_UPDATE_FAILED)
    }
  }

  /**
   * Supprimer un bassin de production
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      // Vérifier que l'utilisateur a les droits
      const user = auth.user!
      if (!['technical_admin', 'basin_admin'].includes(user.role)) {
        return ApiResponse.forbiddenError(
          response,
          ErrorCodes.PRODUCTION_BASIN_DELETE_NOT_AUTHORIZED
        )
      }

      // Supprimer le bassin via le service avec validation métier
      await this.productionBasinService.delete(params.id)

      return ApiResponse.success(response, SuccessCodes.PRODUCTION_BASIN_DELETED)
    } catch (error) {
      // Gérer les erreurs spécifiques du service
      if (error.code === ProductionBasinErrorCodes.NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.PRODUCTION_BASIN_NOT_FOUND)
      }

      if (error.code === ProductionBasinErrorCodes.DELETE_HAS_USERS) {
        return ApiResponse.error(response, ErrorCodes.PRODUCTION_BASIN_DELETE_HAS_USERS, 409)
      }

      console.error('Erreur suppression bassin:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_DELETE_FAILED)
    }
  }

  /**
   * Assigner des utilisateurs à un bassin de production
   */
  async assignUsers({ params, request, response, auth }: HttpContext) {
    try {
      // Validation des données
      const payload = await request.validateUsing(assignUsersValidator)

      // Vérifier que l'utilisateur a les droits
      const user = auth.user!
      if (!['technical_admin', 'basin_admin'].includes(user.role)) {
        return ApiResponse.forbiddenError(
          response,
          ErrorCodes.PRODUCTION_BASIN_ASSIGN_USERS_NOT_AUTHORIZED
        )
      }

      // Assigner via le service
      const basin = await this.productionBasinService.assignUsers(
        params.id,
        payload.userIds.map(String)
      )

      return ApiResponse.success(response, SuccessCodes.PRODUCTION_BASIN_USERS_ASSIGNED, {
        basin: basin.serialize(),
      })
    } catch (error) {
      // Gérer les erreurs de validation VineJS
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.code === ProductionBasinErrorCodes.NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.PRODUCTION_BASIN_NOT_FOUND)
      }

      console.error('Erreur assignation utilisateurs:', error)
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.PRODUCTION_BASIN_ASSIGN_USERS_FAILED
      )
    }
  }

  /**
   * Désassigner des utilisateurs d'un bassin de production
   */
  async unassignUsers({ params, request, response, auth }: HttpContext) {
    try {
      // Validation des données
      const payload = await request.validateUsing(assignUsersValidator)

      // Vérifier que l'utilisateur a les droits
      const user = auth.user!
      if (!['technical_admin', 'basin_admin'].includes(user.role)) {
        return ApiResponse.forbiddenError(
          response,
          ErrorCodes.PRODUCTION_BASIN_UNASSIGN_USERS_NOT_AUTHORIZED
        )
      }

      // Désassigner via le service
      const basin = await this.productionBasinService.unassignUsers(
        params.id,
        payload.userIds.map(String)
      )

      return ApiResponse.success(
        response,
        SuccessCodes.PRODUCTION_BASIN_USERS_UNASSIGNED,
        basin.serialize()
      )
    } catch (error) {
      // Gérer les erreurs de validation VineJS
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      // Gérer les erreurs spécifiques du service
      if (error.code === ProductionBasinErrorCodes.NOT_FOUND) {
        return ApiResponse.notFoundError(response, ErrorCodes.PRODUCTION_BASIN_NOT_FOUND)
      }

      console.error('Erreur désassignation utilisateurs:', error)
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.PRODUCTION_BASIN_UNASSIGN_USERS_FAILED
      )
    }
  }

  /**
   * Récupérer les statistiques des bassins de production
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await this.productionBasinService.getStats()

      return ApiResponse.success(response, SuccessCodes.PRODUCTION_BASIN_STATS_SUCCESS, stats)
    } catch (error) {
      console.error('Erreur récupération statistiques bassins:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.PRODUCTION_BASIN_STATS_FAILED)
    }
  }
}
