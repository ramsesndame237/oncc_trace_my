import Location from '#models/location'
import ProductionBasin from '#models/production_basin'
import User from '#models/user'
import { ProductionBasinErrorCodes } from '#types/errors/production_basin'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

/**
 * Interface pour les conflits de localisation
 */
interface LocationConflict {
  locationCode: string
  locationName: string
  basinId: string
  basinName: string
}

/**
 * Interface pour les conflits hiérarchiques de localisation
 */
interface HierarchicalConflict {
  parentLocationCode: string
  parentLocationName: string
  parentType: 'region' | 'department'
  conflictingChildren: {
    locationCode: string
    locationName: string
    basinId: string
    basinName: string
  }[]
}

/**
 * Interface pour le résultat de la validation hiérarchique
 */
interface HierarchicalValidationResult {
  hasConflicts: boolean
  regionConflicts: HierarchicalConflict[] // Région → Départements enfants déjà ailleurs
  departmentConflicts: HierarchicalConflict[] // Département → Districts enfants déjà ailleurs
  districtParentConflicts: HierarchicalConflict[] // District → Département parent déjà ailleurs
  departmentParentConflicts: HierarchicalConflict[] // Département → Région parente déjà ailleurs
}

/**
 * Service pour la gestion des bassins de production avec validation métier
 */
export default class ProductionBasinService {
  /**
   * Récupérer tous les bassins de production avec pagination et filtres
   */
  async list(options: {
    page: number
    limit: number
    search?: string
    withLocations?: boolean
    withUsers?: boolean
  }): Promise<ModelPaginatorContract<ProductionBasin>> {
    try {
      const { page, limit, search, withLocations, withUsers } = options

      const query = ProductionBasin.query()

      // Recherche par nom ou description
      if (search) {
        query.where((builder) => {
          builder
            .where('name', 'ILIKE', `%${search}%`)
            .orWhere('description', 'ILIKE', `%${search}%`)
        })
      }

      // Inclure les relations si demandées
      if (withLocations) {
        query.preload('locations')
      }

      if (withUsers) {
        query.preload('users', (userQuery) => {
          userQuery.select('id', 'username', 'email', 'givenName', 'familyName', 'role')
        })
      }

      // Ordonner par nom
      query.orderBy('created_at', 'desc')

      return await query.paginate(page, limit)
    } catch (error) {
      throw new Exception('Erreur lors de la récupération des bassins de production', {
        code: ProductionBasinErrorCodes.LIST_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Récupérer un bassin de production spécifique par ID
   */
  async findById(id: string): Promise<ProductionBasin> {
    try {
      const basin = await ProductionBasin.query()
        .where('id', id)
        .preload('locations')
        .preload('users', (userQuery) => {
          userQuery.select('id', 'username', 'email', 'givenName', 'familyName', 'role')
        })
        .firstOrFail()

      return basin
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw new Exception('Bassin de production introuvable', {
          code: ProductionBasinErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      throw new Exception('Erreur lors de la récupération du bassin de production', {
        code: ProductionBasinErrorCodes.LIST_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Créer un nouveau bassin de production avec validation des conflits de localisation
   */
  async create(data: {
    name: string
    description?: string | null
    locationCodes?: string[]
  }): Promise<ProductionBasin> {
    try {
      // Validation des conflits de localisation si des codes sont fournis
      if (data.locationCodes && data.locationCodes.length > 0) {
        // Validation des conflits directs (existant)
        const conflicts = await this.checkLocationConflicts(data.locationCodes)
        if (conflicts.length > 0) {
          const error = new Exception(
            'Certaines localisations sont déjà associées à des bassins de production',
            {
              code: ProductionBasinErrorCodes.LOCATION_CONFLICTS,
              status: 409,
            }
          )
          // Ajouter la propriété conflicts à l'erreur
          ;(error as any).conflicts = conflicts
          throw error
        }

        // Validation des conflits hiérarchiques (nouveau)
        const hierarchicalValidation = await this.validateHierarchicalConflicts(data.locationCodes)

        if (hierarchicalValidation.hasConflicts) {
          // Prioriser les conflits région-département
          if (hierarchicalValidation.regionConflicts.length > 0) {
            const error = new Exception(
              "Impossible d'associer des régions dont les départements sont déjà associés à d'autres bassins",
              {
                code: ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT,
                status: 409,
              }
            )
            ;(error as any).hierarchicalResult = hierarchicalValidation
            throw error
          }

          // Traiter les conflits département-district (descendant)
          if (hierarchicalValidation.departmentConflicts.length > 0) {
            const firstConflict = hierarchicalValidation.departmentConflicts[0]
            const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
            const districtName = firstConflict.conflictingChildren[0]?.locationName || 'un district'

            const error = new Exception(
              `Impossible d'associer le département ${firstConflict.parentLocationName} car son district ${districtName} est déjà dans le bassin "${basinName}"`,
              {
                code: ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT,
                status: 409,
              }
            )
            ;(error as any).hierarchicalResult = hierarchicalValidation
            throw error
          }

          // Traiter les conflits district → département parent (ascendant)
          if (hierarchicalValidation.districtParentConflicts.length > 0) {
            const firstConflict = hierarchicalValidation.districtParentConflicts[0]
            const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
            const districtName = firstConflict.conflictingChildren[0]?.locationName || 'le district'

            const error = new Exception(
              `Impossible d'associer le district ${districtName} car son département parent ${firstConflict.parentLocationName} est déjà dans le bassin "${basinName}"`,
              {
                code: ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT,
                status: 409,
              }
            )
            ;(error as any).hierarchicalResult = hierarchicalValidation
            throw error
          }

          // Traiter les conflits département → région parente (ascendant)
          if (hierarchicalValidation.departmentParentConflicts.length > 0) {
            const firstConflict = hierarchicalValidation.departmentParentConflicts[0]
            const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
            const departmentName = firstConflict.conflictingChildren[0]?.locationName || 'le département'

            const error = new Exception(
              `Impossible d'associer le département ${departmentName} car sa région parente ${firstConflict.parentLocationName} est déjà dans le bassin "${basinName}"`,
              {
                code: ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT,
                status: 409,
              }
            )
            ;(error as any).hierarchicalResult = hierarchicalValidation
            throw error
          }
        }
      }

      // Créer le bassin de production dans une transaction
      const basin = await db.transaction(async (trx) => {
        // Créer le bassin
        const newBasin = await ProductionBasin.create(
          {
            name: data.name,
            description: data.description,
          },
          { client: trx }
        )

        // Associer les localisations si spécifiées
        if (data.locationCodes && data.locationCodes.length > 0) {
          await newBasin.related('locations').attach(data.locationCodes, trx)

          // Mettre à jour la date updated_at des localisations ajoutées
          await Location.query({ client: trx })
            .whereIn('code', data.locationCodes)
            .update({ updatedAt: DateTime.now().toJSDate() })

          console.log(
            `➕ Localisations ajoutées au nouveau bassin "${newBasin.name}":`,
            data.locationCodes
          )
        }

        return newBasin
      })

      // Charger les relations pour la réponse
      await basin.load('locations')
      return basin
    } catch (error) {
      // Re-lancer les erreurs métier
      if (
        error.code === ProductionBasinErrorCodes.LOCATION_CONFLICTS ||
        error.code === ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT
      ) {
        throw error
      }

      throw new Exception('Erreur lors de la création du bassin de production', {
        code: ProductionBasinErrorCodes.CREATE_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Mettre à jour un bassin de production avec validation des conflits de localisation
   */
  async update(
    id: string,
    data: {
      name?: string
      description?: string | null
      locationCodes?: string[]
    }
  ): Promise<ProductionBasin> {
    try {
      // Récupérer le bassin existant
      const basin = await ProductionBasin.findOrFail(id)

      // Validation des conflits de localisation si des codes sont fournis
      if (data.locationCodes !== undefined && data.locationCodes.length > 0) {
        // Déterminer les nouvelles localisations seulement
        const newLocationCodes = await this.getNewLocationCodes(id, data.locationCodes)

        // Valider les conflits directs pour toutes les localisations (existant)
        const conflicts = await this.checkLocationConflicts(data.locationCodes, id)
        if (conflicts.length > 0) {
          const error = new Exception(
            'Certaines localisations sont déjà associées à des bassins de production',
            {
              code: ProductionBasinErrorCodes.LOCATION_CONFLICTS,
              status: 409,
            }
          )
          // Ajouter la propriété conflicts à l'erreur
          ;(error as any).conflicts = conflicts
          throw error
        }

        // Validation des conflits hiérarchiques pour les nouvelles localisations seulement
        if (newLocationCodes.length > 0) {
          const hierarchicalValidation = await this.validateHierarchicalConflicts(
            newLocationCodes,
            id
          )

          if (hierarchicalValidation.hasConflicts) {
            // Prioriser les conflits région-département
            if (hierarchicalValidation.regionConflicts.length > 0) {
              const error = new Exception(
                "Impossible d'associer des régions dont les départements sont déjà associés à d'autres bassins",
                {
                  code: ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT,
                  status: 409,
                }
              )
              ;(error as any).hierarchicalResult = hierarchicalValidation
              throw error
            }

            // Traiter les conflits département-district (descendant)
            if (hierarchicalValidation.departmentConflicts.length > 0) {
              const firstConflict = hierarchicalValidation.departmentConflicts[0]
              const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
              const districtName = firstConflict.conflictingChildren[0]?.locationName || 'un district'

              const error = new Exception(
                `Impossible d'associer le département ${firstConflict.parentLocationName} car son district ${districtName} est déjà dans le bassin "${basinName}"`,
                {
                  code: ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT,
                  status: 409,
                }
              )
              ;(error as any).hierarchicalResult = hierarchicalValidation
              throw error
            }

            // Traiter les conflits district → département parent (ascendant)
            if (hierarchicalValidation.districtParentConflicts.length > 0) {
              const firstConflict = hierarchicalValidation.districtParentConflicts[0]
              const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
              const districtName = firstConflict.conflictingChildren[0]?.locationName || 'le district'

              const error = new Exception(
                `Impossible d'associer le district ${districtName} car son département parent ${firstConflict.parentLocationName} est déjà dans le bassin "${basinName}"`,
                {
                  code: ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT,
                  status: 409,
                }
              )
              ;(error as any).hierarchicalResult = hierarchicalValidation
              throw error
            }

            // Traiter les conflits département → région parente (ascendant)
            if (hierarchicalValidation.departmentParentConflicts.length > 0) {
              const firstConflict = hierarchicalValidation.departmentParentConflicts[0]
              const basinName = firstConflict.conflictingChildren[0]?.basinName || 'un autre bassin'
              const departmentName = firstConflict.conflictingChildren[0]?.locationName || 'le département'

              const error = new Exception(
                `Impossible d'associer le département ${departmentName} car sa région parente ${firstConflict.parentLocationName} est déjà dans le bassin "${basinName}"`,
                {
                  code: ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT,
                  status: 409,
                }
              )
              ;(error as any).hierarchicalResult = hierarchicalValidation
              throw error
            }
          }
        }
      }

      // Mettre à jour dans une transaction
      await db.transaction(async (trx) => {
        basin.useTransaction(trx)

        // Mettre à jour les champs modifiés
        if (data.name !== undefined) {
          basin.name = data.name
        }
        if (data.description !== undefined) {
          basin.description = data.description
        }

        await basin.save()

        // Mettre à jour les localisations si spécifiées
        if (data.locationCodes !== undefined) {
          // Charger les localisations actuelles du bassin
          const currentLocations = await db
            .from('production_basin_locations')
            .where('production_basin_id', basin.id)
            .select('location_code')

          const currentLocationCodes = currentLocations.map((loc) => loc.location_code)

          // Identifier les localisations qui vont être ajoutées
          const addedLocationCodes = data.locationCodes.filter(
            (code: string) => !currentLocationCodes.includes(code)
          )

          // Identifier les localisations qui vont être supprimées
          const removedLocationCodes = currentLocationCodes.filter(
            (code: string) => !data.locationCodes!.includes(code)
          )

          // Synchroniser les localisations
          await basin.related('locations').sync(data.locationCodes, true)

          // Mettre à jour la date updated_at des localisations ajoutées
          if (addedLocationCodes.length > 0) {
            await Location.query({ client: trx })
              .whereIn('code', addedLocationCodes)
              .update({ updatedAt: DateTime.now().toJSDate() })

            console.log(
              `➕ Localisations ajoutées au bassin "${basin.name}":`,
              addedLocationCodes
            )
          }

          // Mettre à jour la date updated_at des localisations supprimées
          if (removedLocationCodes.length > 0) {
            await Location.query({ client: trx })
              .whereIn('code', removedLocationCodes)
              .update({ updatedAt: DateTime.now().toJSDate() })

            console.log(
              `➖ Localisations supprimées du bassin "${basin.name}":`,
              removedLocationCodes
            )
          }
        }
      })

      // Charger les relations pour la réponse
      await basin.load('locations')
      await basin.load('users', (userQuery) => {
        userQuery.select('id', 'username', 'email', 'givenName', 'familyName', 'role')
      })

      return basin
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw new Exception('Bassin de production introuvable', {
          code: ProductionBasinErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      // Re-lancer les erreurs métier
      if (
        error.code === ProductionBasinErrorCodes.LOCATION_CONFLICTS ||
        error.code === ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT ||
        error.code === ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT
      ) {
        throw error
      }

      throw new Exception('Erreur lors de la mise à jour du bassin de production', {
        code: ProductionBasinErrorCodes.UPDATE_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Supprimer un bassin de production avec validation métier
   */
  async delete(id: string): Promise<void> {
    try {
      const basin = await ProductionBasin.findOrFail(id)

      // Vérifier qu'aucun utilisateur n'est assigné au bassin
      await basin.load('users')
      if (basin.users && basin.users.length > 0) {
        throw new Exception(
          'Impossible de supprimer un bassin de production ayant des utilisateurs assignés',
          {
            code: ProductionBasinErrorCodes.DELETE_HAS_USERS,
            status: 409,
          }
        )
      }

      // Supprimer dans une transaction
      await db.transaction(async (trx) => {
        basin.useTransaction(trx)

        // Récupérer les localisations actuelles du bassin avant suppression
        const currentLocations = await db
          .from('production_basin_locations')
          .where('production_basin_id', basin.id)
          .select('location_code')

        const currentLocationCodes = currentLocations.map((loc) => loc.location_code)

        // Supprimer d'abord les relations avec les localisations
        await basin.related('locations').detach(undefined, trx)

        // Mettre à jour la date updated_at des localisations supprimées
        if (currentLocationCodes.length > 0) {
          await Location.query({ client: trx })
            .whereIn('code', currentLocationCodes)
            .update({ updatedAt: DateTime.now().toJSDate() })

          console.log(
            `➖ Localisations supprimées lors de la suppression du bassin "${basin.name}":`,
            currentLocationCodes
          )
        }

        // Supprimer le bassin
        await basin.delete()
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw new Exception('Bassin de production introuvable', {
          code: ProductionBasinErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      // Re-lancer les erreurs métier
      if (error.code === ProductionBasinErrorCodes.DELETE_HAS_USERS) {
        throw error
      }

      throw new Exception('Erreur lors de la suppression du bassin de production', {
        code: ProductionBasinErrorCodes.DELETE_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Assigner des utilisateurs à un bassin de production
   */
  async assignUsers(basinId: string, userIds: string[]): Promise<ProductionBasin> {
    try {
      const basin = await ProductionBasin.findOrFail(basinId)

      // Vérifier que tous les utilisateurs existent
      const users = await User.query().whereIn('id', userIds)
      if (users.length !== userIds.length) {
        throw new Exception('Un ou plusieurs utilisateurs introuvables', {
          code: ProductionBasinErrorCodes.ASSIGN_USERS_FAILED,
          status: 404,
        })
      }

      // Assigner les utilisateurs au bassin via la foreign key
      await User.query().whereIn('id', userIds).update({ productionBasinId: basin.id })

      // Charger les utilisateurs pour la réponse
      await basin.load('users', (userQuery) => {
        userQuery.select('id', 'username', 'email', 'givenName', 'familyName', 'role')
      })

      return basin
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw new Exception('Bassin de production introuvable', {
          code: ProductionBasinErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      throw new Exception("Erreur lors de l'assignation des utilisateurs", {
        code: ProductionBasinErrorCodes.ASSIGN_USERS_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Désassigner des utilisateurs d'un bassin de production
   */
  async unassignUsers(basinId: string, userIds: string[]): Promise<ProductionBasin> {
    try {
      const basin = await ProductionBasin.findOrFail(basinId)

      // Désassigner les utilisateurs du bassin en remettant productionBasinId à null
      await User.query()
        .whereIn('id', userIds)
        .where('productionBasinId', basin.id)
        .update({ productionBasinId: null })

      // Charger les utilisateurs restants pour la réponse
      await basin.load('users', (userQuery) => {
        userQuery.select('id', 'username', 'email', 'givenName', 'familyName', 'role')
      })

      return basin
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw new Exception('Bassin de production introuvable', {
          code: ProductionBasinErrorCodes.NOT_FOUND,
          status: 404,
        })
      }

      throw new Exception('Erreur lors de la désassignation des utilisateurs', {
        code: ProductionBasinErrorCodes.UNASSIGN_USERS_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Valider les conflits hiérarchiques pour les nouvelles localisations
   */
  private async validateHierarchicalConflicts(
    newLocationCodes: string[],
    excludeBasinId?: string
  ): Promise<HierarchicalValidationResult> {
    if (!newLocationCodes || newLocationCodes.length === 0) {
      return {
        hasConflicts: false,
        regionConflicts: [],
        departmentConflicts: [],
        districtParentConflicts: [],
        departmentParentConflicts: [],
      }
    }

    try {
      // Récupérer les types de toutes les localisations en une seule requête
      const locations = await db
        .from('locations')
        .whereIn('code', newLocationCodes)
        .select('code', 'type')

      // Filtrer par type
      const regionCodes = locations.filter((loc) => loc.type === 'region').map((loc) => loc.code)
      const departmentCodes = locations
        .filter((loc) => loc.type === 'department')
        .map((loc) => loc.code)
      const districtCodes = locations.filter((loc) => loc.type === 'district').map((loc) => loc.code)

      // Valider les conflits pour chaque type (validations descendantes et ascendantes)
      const [
        regionConflicts,
        departmentConflicts,
        districtParentConflicts,
        departmentParentConflicts,
      ] = await Promise.all([
        // Validations descendantes (parent → enfants)
        this.validateRegionDepartmentConflicts(regionCodes, excludeBasinId),
        this.validateDepartmentDistrictConflicts(departmentCodes, excludeBasinId),
        // Validations ascendantes (enfant → parent)
        this.validateDistrictParentConflicts(districtCodes, excludeBasinId),
        this.validateDepartmentParentConflicts(departmentCodes, excludeBasinId),
      ])

      return {
        hasConflicts:
          regionConflicts.length > 0 ||
          departmentConflicts.length > 0 ||
          districtParentConflicts.length > 0 ||
          departmentParentConflicts.length > 0,
        regionConflicts,
        departmentConflicts,
        districtParentConflicts,
        departmentParentConflicts,
      }
    } catch (error) {
      throw new Exception('Erreur lors de la validation hiérarchique des localisations', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Déterminer les nouvelles localisations (non présentes dans le bassin actuel)
   */
  private async getNewLocationCodes(
    basinId: string,
    proposedLocationCodes: string[]
  ): Promise<string[]> {
    try {
      // Récupérer les localisations actuelles du bassin
      const currentLocations = await db
        .from('production_basin_locations')
        .where('production_basin_id', basinId)
        .select('location_code')

      const currentLocationCodes = currentLocations.map((loc) => loc.location_code)

      // Retourner seulement les codes qui ne sont pas déjà présents
      return proposedLocationCodes.filter((code) => !currentLocationCodes.includes(code))
    } catch (error) {
      throw new Exception('Erreur lors de la détermination des nouvelles localisations', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Valider les conflits région-département
   */
  private async validateRegionDepartmentConflicts(
    regionCodes: string[],
    excludeBasinId?: string
  ): Promise<HierarchicalConflict[]> {
    if (!regionCodes || regionCodes.length === 0) {
      return []
    }

    try {
      // Requête optimisée pour détecter les conflits région-département
      const conflictsQuery = db
        .from('locations as l_parent')
        .join('locations as l_child', 'l_parent.code', 'l_child.parent_code')
        .join('production_basin_locations as pbl', 'l_child.code', 'pbl.location_code')
        .join('production_basins as pb', 'pbl.production_basin_id', 'pb.id')
        .whereIn('l_parent.code', regionCodes)
        .where('l_parent.type', 'region')
        .where('l_child.type', 'department')
        .select(
          'l_parent.code as region_code',
          'l_parent.name as region_name',
          'l_child.code as department_code',
          'l_child.name as department_name',
          'pb.id as basin_id',
          'pb.name as basin_name'
        )

      if (excludeBasinId) {
        conflictsQuery.whereNot('pb.id', excludeBasinId)
      }

      const conflicts = await conflictsQuery

      // Grouper les conflits par région
      const groupedConflicts = conflicts.reduce(
        (acc, conflict) => {
          const regionKey = conflict.region_code
          if (!acc[regionKey]) {
            acc[regionKey] = {
              parentLocationCode: conflict.region_code,
              parentLocationName: conflict.region_name,
              parentType: 'region' as const,
              conflictingChildren: [],
            }
          }

          acc[regionKey].conflictingChildren.push({
            locationCode: conflict.department_code,
            locationName: conflict.department_name,
            basinId: conflict.basin_id,
            basinName: conflict.basin_name,
          })

          return acc
        },
        {} as Record<string, HierarchicalConflict>
      )

      return Object.values(groupedConflicts)
    } catch (error) {
      throw new Exception('Erreur lors de la validation des conflits région-département', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Valider les conflits département-district
   */
  private async validateDepartmentDistrictConflicts(
    departmentCodes: string[],
    excludeBasinId?: string
  ): Promise<HierarchicalConflict[]> {
    if (!departmentCodes || departmentCodes.length === 0) {
      return []
    }

    try {
      // Requête optimisée pour détecter les conflits département-district
      const conflictsQuery = db
        .from('locations as l_parent')
        .join('locations as l_child', 'l_parent.code', 'l_child.parent_code')
        .join('production_basin_locations as pbl', 'l_child.code', 'pbl.location_code')
        .join('production_basins as pb', 'pbl.production_basin_id', 'pb.id')
        .whereIn('l_parent.code', departmentCodes)
        .where('l_parent.type', 'department')
        .where('l_child.type', 'district')
        .select(
          'l_parent.code as department_code',
          'l_parent.name as department_name',
          'l_child.code as district_code',
          'l_child.name as district_name',
          'pb.id as basin_id',
          'pb.name as basin_name'
        )

      if (excludeBasinId) {
        conflictsQuery.whereNot('pb.id', excludeBasinId)
      }

      const conflicts = await conflictsQuery

      // Grouper les conflits par département
      const groupedConflicts = conflicts.reduce(
        (acc, conflict) => {
          const departmentKey = conflict.department_code
          if (!acc[departmentKey]) {
            acc[departmentKey] = {
              parentLocationCode: conflict.department_code,
              parentLocationName: conflict.department_name,
              parentType: 'department' as const,
              conflictingChildren: [],
            }
          }

          acc[departmentKey].conflictingChildren.push({
            locationCode: conflict.district_code,
            locationName: conflict.district_name,
            basinId: conflict.basin_id,
            basinName: conflict.basin_name,
          })

          return acc
        },
        {} as Record<string, HierarchicalConflict>
      )

      return Object.values(groupedConflicts)
    } catch (error) {
      throw new Exception('Erreur lors de la validation des conflits département-district', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Valider les conflits district → département parent (validation inverse)
   * Vérifie si le département parent d'un district est déjà dans un autre bassin
   */
  private async validateDistrictParentConflicts(
    districtCodes: string[],
    excludeBasinId?: string
  ): Promise<HierarchicalConflict[]> {
    if (!districtCodes || districtCodes.length === 0) {
      return []
    }

    try {
      // Requête pour détecter les conflits district → département parent
      const conflictsQuery = db
        .from('locations as l_child')
        .join('locations as l_parent', 'l_child.parent_code', 'l_parent.code')
        .join('production_basin_locations as pbl', 'l_parent.code', 'pbl.location_code')
        .join('production_basins as pb', 'pbl.production_basin_id', 'pb.id')
        .whereIn('l_child.code', districtCodes)
        .where('l_child.type', 'district')
        .where('l_parent.type', 'department')
        .select(
          'l_child.code as district_code',
          'l_child.name as district_name',
          'l_parent.code as department_code',
          'l_parent.name as department_name',
          'pb.id as basin_id',
          'pb.name as basin_name'
        )

      if (excludeBasinId) {
        conflictsQuery.whereNot('pb.id', excludeBasinId)
      }

      const conflicts = await conflictsQuery

      // Grouper les conflits par district
      const groupedConflicts = conflicts.reduce(
        (acc, conflict) => {
          const districtKey = conflict.district_code
          if (!acc[districtKey]) {
            acc[districtKey] = {
              parentLocationCode: conflict.department_code,
              parentLocationName: conflict.department_name,
              parentType: 'department' as const,
              conflictingChildren: [],
            }
          }

          acc[districtKey].conflictingChildren.push({
            locationCode: conflict.district_code,
            locationName: conflict.district_name,
            basinId: conflict.basin_id,
            basinName: conflict.basin_name,
          })

          return acc
        },
        {} as Record<string, HierarchicalConflict>
      )

      return Object.values(groupedConflicts)
    } catch (error) {
      throw new Exception('Erreur lors de la validation des conflits district-département', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Valider les conflits département → région parente (validation inverse)
   * Vérifie si la région parente d'un département est déjà dans un autre bassin
   */
  private async validateDepartmentParentConflicts(
    departmentCodes: string[],
    excludeBasinId?: string
  ): Promise<HierarchicalConflict[]> {
    if (!departmentCodes || departmentCodes.length === 0) {
      return []
    }

    try {
      // Requête pour détecter les conflits département → région parente
      const conflictsQuery = db
        .from('locations as l_child')
        .join('locations as l_parent', 'l_child.parent_code', 'l_parent.code')
        .join('production_basin_locations as pbl', 'l_parent.code', 'pbl.location_code')
        .join('production_basins as pb', 'pbl.production_basin_id', 'pb.id')
        .whereIn('l_child.code', departmentCodes)
        .where('l_child.type', 'department')
        .where('l_parent.type', 'region')
        .select(
          'l_child.code as department_code',
          'l_child.name as department_name',
          'l_parent.code as region_code',
          'l_parent.name as region_name',
          'pb.id as basin_id',
          'pb.name as basin_name'
        )

      if (excludeBasinId) {
        conflictsQuery.whereNot('pb.id', excludeBasinId)
      }

      const conflicts = await conflictsQuery

      // Grouper les conflits par département
      const groupedConflicts = conflicts.reduce(
        (acc, conflict) => {
          const departmentKey = conflict.department_code
          if (!acc[departmentKey]) {
            acc[departmentKey] = {
              parentLocationCode: conflict.region_code,
              parentLocationName: conflict.region_name,
              parentType: 'region' as const,
              conflictingChildren: [],
            }
          }

          acc[departmentKey].conflictingChildren.push({
            locationCode: conflict.department_code,
            locationName: conflict.department_name,
            basinId: conflict.basin_id,
            basinName: conflict.basin_name,
          })

          return acc
        },
        {} as Record<string, HierarchicalConflict>
      )

      return Object.values(groupedConflicts)
    } catch (error) {
      throw new Exception('Erreur lors de la validation des conflits département-région', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Vérifier les conflits de localisation - méthode privée pour la validation métier
   */
  private async checkLocationConflicts(
    locationCodes: string[],
    excludeBasinId?: string
  ): Promise<LocationConflict[]> {
    if (!locationCodes || locationCodes.length === 0) {
      return []
    }

    try {
      // Construire la requête pour détecter les conflits
      const conflictsQuery = db
        .from('production_basins as pb')
        .join('production_basin_locations as pbl', 'pb.id', 'pbl.production_basin_id')
        .join('locations as l', 'pbl.location_code', 'l.code')
        .whereIn('l.code', locationCodes)
        .select(
          'l.code as location_code',
          'l.name as location_name',
          'pb.id as basin_id',
          'pb.name as basin_name'
        )

      // Exclure le bassin en cours de modification pour éviter les faux positifs
      if (excludeBasinId) {
        conflictsQuery.whereNot('pb.id', excludeBasinId)
      }

      const conflicts = await conflictsQuery

      // Transformer le résultat en interface LocationConflict
      return conflicts.map((conflict) => ({
        locationCode: conflict.location_code,
        locationName: conflict.location_name,
        basinId: conflict.basin_id,
        basinName: conflict.basin_name,
      }))
    } catch (error) {
      throw new Exception('Erreur lors de la vérification des conflits de localisation', {
        code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Récupérer tous les codes de localisation d'un bassin de production avec propagation hiérarchique
   * Cette méthode récupère les associations directes et applique la propagation hiérarchique
   */
  async getLocationCodesWithPropagation(basinId: string): Promise<string[]> {
    try {
      // Récupérer les associations directes
      const directAssociations = await db
        .from('production_basin_locations')
        .where('production_basin_id', basinId)
        .select('location_code')

      const directCodes = directAssociations.map((a) => a.location_code)

      if (directCodes.length === 0) {
        return []
      }

      // Récupérer les informations complètes des localisations directement associées
      const locations = await db
        .from('locations')
        .whereIn('code', directCodes)
        .select('code', 'type', 'parent_code')

      // Ensemble pour stocker tous les codes (y compris propagés)
      const propagatedCodes = new Set<string>(directCodes)

      // Appliquer la propagation selon le type
      for (const location of locations) {
        if (location.type === 'region') {
          // Pour une région: inclure tous les descendants (départements, districts, villages)
          const descendants = await db
            .from('locations')
            .where((builder) => {
              builder
                .where('parent_code', location.code) // Départements
                .orWhereIn(
                  'parent_code',
                  db.from('locations').where('parent_code', location.code).select('code')
                ) // Districts
                .orWhereIn(
                  'parent_code',
                  db
                    .from('locations')
                    .whereIn(
                      'parent_code',
                      db.from('locations').where('parent_code', location.code).select('code')
                    )
                    .select('code')
                ) // Villages
            })
            .select('code')

          descendants.forEach((d) => propagatedCodes.add(d.code))
        } else if (location.type === 'department') {
          // Pour un département: inclure les enfants (districts) et le parent (région)
          const children = await db
            .from('locations')
            .where('parent_code', location.code)
            .select('code')

          children.forEach((c) => propagatedCodes.add(c.code))

          if (location.parent_code) {
            propagatedCodes.add(location.parent_code)
          }
        } else if (location.type === 'district') {
          // Pour un district: inclure le parent (département) et grand-parent (région)
          if (location.parent_code) {
            propagatedCodes.add(location.parent_code)

            const parent = await db
              .from('locations')
              .where('code', location.parent_code)
              .select('parent_code')
              .first()

            if (parent?.parent_code) {
              propagatedCodes.add(parent.parent_code)
            }
          }
        }
        // Pour les villages, pas de propagation spéciale
      }

      return Array.from(propagatedCodes)
    } catch (error) {
      throw new Exception(
        'Erreur lors de la récupération des codes de localisation avec propagation',
        {
          code: ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED,
          status: 500,
          cause: error,
        }
      )
    }
  }

  /**
   * Récupérer les statistiques des bassins de production
   */
  async getStats() {
    try {
      // Compter le total des bassins
      const totalResult = await ProductionBasin.query().count('* as total')
      const totalCount = Number.parseInt(totalResult[0].$extras.total, 10)

      // Compter les bassins actifs (ceux qui ont des localisations associées)
      const activeResult = await db
        .from('production_basins as pb')
        .join('production_basin_locations as pbl', 'pb.id', 'pbl.production_basin_id')
        .countDistinct('pb.id as total')

      const activeCount = Number.parseInt(activeResult[0].total, 10)

      // Calculer les bassins inactifs (sans localisations)
      const inactiveCount = totalCount - activeCount

      // Statistiques par statut
      const byStatus = [
        {
          status: 'active',
          total: activeCount,
        },
        {
          status: 'inactive',
          total: inactiveCount,
        },
      ]

      return {
        total: totalCount,
        active: activeCount,
        byStatus,
      }
    } catch (error) {
      throw new Exception('Erreur lors de la récupération des statistiques des bassins', {
        code: ProductionBasinErrorCodes.STATS_FAILED,
        status: 500,
        cause: error,
      })
    }
  }
}
