import Location from '#models/location'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import type { HttpContext } from '@adonisjs/core/http'

export default class LocationsController {
  /**
   * Récupérer toutes les localisations avec filtres et recherche
   */
  async index({ request, response }: HttpContext) {
    try {
      const search = request.input('search')
      const parentCode = request.input('parentCode')

      const query = Location.query().where('status', 'active')

      // Recherche par nom ou code
      if (search) {
        query.where((builder) => {
          builder.where('name', 'ILIKE', `%${search}%`).orWhere('code', 'ILIKE', `%${search}%`)
        })
      }

      // Filtrage par parent (pour la navigation hiérarchique)
      if (parentCode) {
        query.where('parentCode', parentCode)
      }

      // Précharger les relations
      query
        .preload('parent', (parentQuery) => {
          // Précharger les bassins du parent pour la propagation
          parentQuery.preload('productionBasins')
        })
        .preload('children')
        .preload('productionBasins')
        .orderBy([
          { column: 'type', order: 'asc' },
          { column: 'name', order: 'asc' },
        ])

      const locations = await query

      const serializedLocations = locations.map((location) => location.serialize())

      return ApiResponse.success(response, SuccessCodes.LOCATION_LIST_SUCCESS, serializedLocations)
    } catch (error) {
      console.error('Erreur récupération localisations:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.LOCATION_LIST_FAILED)
    }
  }

  /**
   * Récupérer la hiérarchie complète des localisations
   */
  async hierarchy({ response }: HttpContext) {
    try {
      // Récupérer toutes les régions (niveau racine)
      const regions = await Location.query()
        .where('type', 'region')
        .where('status', 'active')
        .preload('productionBasins')
        .preload('children', (childrenQuery) => {
          childrenQuery
            .where('status', 'active')
            .preload('parent', (parentQuery) => parentQuery.preload('productionBasins'))
            .preload('productionBasins')
            .preload('children', (grandChildrenQuery) => {
              grandChildrenQuery
                .where('status', 'active')
                .preload('parent', (parentQuery) => parentQuery.preload('productionBasins'))
                .preload('productionBasins')
                .preload('children', (greatGrandChildrenQuery) => {
                  greatGrandChildrenQuery
                    .where('status', 'active')
                    .preload('parent', (parentQuery) => parentQuery.preload('productionBasins'))
                    .preload('productionBasins')
                })
            })
        })
        .orderBy('name', 'asc')

      const serializedRegions = regions.map((region) => region.serialize())

      return ApiResponse.success(
        response,
        SuccessCodes.LOCATION_HIERARCHY_SUCCESS,
        serializedRegions
      )
    } catch (error) {
      console.error('Erreur récupération hiérarchie localisations:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.LOCATION_HIERARCHY_FAILED)
    }
  }

  /**
   * Récupérer les enfants d'une localisation
   */
  async children({ params, response }: HttpContext) {
    try {
      const children = await Location.query()
        .where('parentCode', params.code)
        .where('status', 'active')
        .preload('parent', (parentQuery) => {
          // Précharger les bassins du parent pour la propagation
          parentQuery.preload('productionBasins')
        })
        .preload('productionBasins')
        .orderBy('name', 'asc')

      const serializedChildren = children.map((child) => child.serialize())

      return ApiResponse.success(
        response,
        SuccessCodes.LOCATION_CHILDREN_SUCCESS,
        serializedChildren
      )
    } catch (error) {
      console.error('Erreur récupération enfants localisation:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.LOCATION_CHILDREN_FAILED)
    }
  }
}
