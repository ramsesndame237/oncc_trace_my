import ParcelException from '#exceptions/parcel_exception'
import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Parcel from '#models/parcel'
import ParcelCoordinate from '#models/parcel_coordinate'
import {
  BulkCreateResult,
  CreateParcelData,
  ParcelFilterOptions,
  UpdateParcelData,
} from '#types/parcel_types'
import db from '@adonisjs/lucid/services/db'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export default class ParcelService {
  /**
   * Récupérer une liste de parcelles avec filtres et pagination
   */
  async list(options: ParcelFilterOptions): Promise<ModelPaginatorContract<Parcel>> {
    const { page = 1, limit = 20, producerId, locationCode, parcelType, status, search } = options

    let query = Parcel.query()
      .preload('producer')
      .preload('location')
      .preload('coordinates', (coordinatesQuery) => {
        coordinatesQuery.orderBy('pointOrder', 'asc')
      })
      .whereNull('deletedAt')

    // Filtres
    if (producerId) {
      query = query.where('producerId', producerId)
    }

    if (locationCode) {
      query = query.where('locationCode', locationCode)
    }

    if (parcelType) {
      query = query.where('parcelType', parcelType)
    }

    if (status) {
      query = query.where('status', status)
    }

    if (search) {
      query = query.where((searchQuery) => {
        searchQuery
          .whereILike('identificationId', `%${search}%`)
          .orWhereILike('onccId', `%${search}%`)
          .orWhereHas('producer', (producerQuery) => {
            producerQuery
              .whereILike('familyName', `%${search}%`)
              .orWhereILike('givenName', `%${search}%`)
          })
      })
    }

    return await query.orderBy('createdAt', 'desc').paginate(page, limit)
  }

  /**
   * Récupérer les parcelles d'un producteur
   */
  async getByProducer(producerId: string): Promise<Parcel[]> {
    // Vérifier que le producteur existe
    await this.validateProducerExists(producerId)

    return await Parcel.query()
      .where('producerId', producerId)
      .preload('location')
      .preload('coordinates', (coordinatesQuery) => {
        coordinatesQuery.orderBy('pointOrder', 'asc')
      })
      .orderBy('createdAt', 'asc')
  }

  /**
   * Créer une nouvelle parcelle avec audit log
   */
  async create(
    data: CreateParcelData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Parcel> {
    // Vérifier que le producteur existe
    await this.validateProducerExists(data.producerId)

    // Vérifier l'unicité de l'onccId si fourni
    if (data.onccId) {
      await this.validateOnccIdUnique(data.onccId)
    }

    // Vérifier l'unicité de l'identificationId si fourni
    if (data.identificationId) {
      await this.validateIdentificationIdUnique(data.identificationId)
    }

    return await db.transaction(async (trx) => {
      // Créer la parcelle
      const parcel = await Parcel.create(
        {
          producerId: data.producerId,
          locationCode: data.locationCode,
          surfaceArea: data.surfaceArea,
          parcelCreationDate: data.parcelCreationDate,
          parcelType: data.parcelType,
          identificationId: data.identificationId,
          onccId: data.onccId,
          status: data.status || 'active',
        },
        { client: trx }
      )

      // Ajouter les coordonnées si fournies
      if (data.coordinates && data.coordinates.length > 0) {
        const coordinatesData = data.coordinates.map((coord) => ({
          parcelId: parcel.id,
          latitude: coord.latitude,
          longitude: coord.longitude,
          pointOrder: coord.pointOrder,
        }))

        await ParcelCoordinate.createMany(coordinatesData, { client: trx })
      }

      // Recharger la parcelle avec ses relations
      await parcel.load('producer')
      await parcel.load('location')
      await parcel.load('coordinates', (coordinatesQuery) => {
        coordinatesQuery.orderBy('pointOrder', 'asc')
      })

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          const newValues: any = {
            producerId: parcel.producerId,
            locationCode: parcel.locationCode,
            surfaceArea: parcel.surfaceArea,
            parcelType: parcel.parcelType,
            identificationId: parcel.identificationId,
            onccId: parcel.onccId,
          }

          // Ajouter les coordonnées si elles existent
          if (parcel.coordinates && parcel.coordinates.length > 0) {
            newValues.coordinates = parcel.coordinates.map((coord) => ({
              id: coord.id,
              latitude: coord.latitude,
              longitude: coord.longitude,
              pointOrder: coord.pointOrder,
            }))
          }

          await AuditLog.logAction({
            auditableType: 'Parcel',
            auditableId: parcel.id,
            action: 'create',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
          // On ne bloque pas la création de la parcelle si l'audit log échoue
        }
      }

      return parcel
    })
  }

  /**
   * Créer plusieurs parcelles pour un producteur spécifique avec audit logs
   */
  async bulkCreateForProducer(
    producerId: string,
    parcelsData: Omit<CreateParcelData, 'producerId'>[],
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<BulkCreateResult> {
    // Vérifier que le producteur existe une seule fois
    await this.validateProducerExists(producerId)

    const result: BulkCreateResult = {
      success: [],
      errors: [],
      summary: {
        total: parcelsData.length,
        successful: 0,
        failed: 0,
      },
    }

    // Traiter chaque parcelle individuellement pour capturer les erreurs
    for (const [index, parcelData] of parcelsData.entries()) {
      try {
        const fullParcelData: CreateParcelData = {
          ...parcelData,
          producerId,
        }
        // La méthode create() gère déjà l'audit log pour la parcelle
        const parcel = await this.create(fullParcelData, auditContext)
        result.success.push(parcel)
        result.summary.successful++

        // Audit supplémentaire pour le producteur - Ajout de parcelle
        if (auditContext) {
          try {
            await AuditLog.logAction({
              auditableType: 'Actor',
              auditableId: producerId,
              action: 'add_parcel',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues: null,
              newValues: {
                parcel_id: parcel.id,
                parcel_identification_id: parcel.identificationId,
                parcel_oncc_id: parcel.onccId,
                parcel_type: parcel.parcelType,
                location_code: parcel.locationCode,
              },
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })
          } catch (auditError) {
            console.error(
              "Erreur lors de l'enregistrement de l'audit log pour le producteur:",
              auditError
            )
            // On ne bloque pas la création de la parcelle si l'audit log échoue
          }
        }
      } catch (error) {
        result.errors.push({
          index,
          parcel: { ...parcelData, producerId },
          error: error.message || 'Erreur inconnue',
        })
        result.summary.failed++
      }
    }

    return result
  }

  /**
   * Récupérer une parcelle par son ID
   */
  async findById(id: string): Promise<Parcel> {
    const parcel = await Parcel.query()
      .where('id', id)
      .whereNull('deletedAt')
      .preload('producer')
      .preload('location')
      .preload('coordinates', (coordinatesQuery) => {
        coordinatesQuery.orderBy('pointOrder', 'asc')
      })
      .firstOrFail()

    return parcel
  }

  /**
   * Mettre à jour une parcelle avec audit log
   */
  async update(
    id: string,
    data: UpdateParcelData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Parcel> {
    const parcel = await this.findById(id)

    // Sauvegarder les valeurs originales pour l'audit log
    const originalValues = {
      locationCode: parcel.locationCode,
      surfaceArea: parcel.surfaceArea,
      parcelType: parcel.parcelType,
      identificationId: parcel.identificationId,
      onccId: parcel.onccId,
      coordinates: parcel.coordinates
        ? parcel.coordinates.map((coord) => ({
            id: coord.id,
            latitude: coord.latitude,
            longitude: coord.longitude,
            pointOrder: coord.pointOrder,
          }))
        : [],
    }

    // Vérifier l'unicité de l'onccId si fourni et différent
    if (data.onccId && data.onccId !== parcel.onccId) {
      await this.validateOnccIdUnique(data.onccId)
    }

    // Vérifier l'unicité de l'identificationId si fourni et différent
    if (data.identificationId && data.identificationId !== parcel.identificationId) {
      await this.validateIdentificationIdUnique(data.identificationId)
    }

    return await db.transaction(async (trx) => {
      // Mettre à jour les données de la parcelle (sans les coordonnées)
      const { coordinates, ...parcelData } = data

      // Mettre à jour les données de base de la parcelle
      await Parcel.query({ client: trx }).where('id', parcel.id).update(parcelData)

      // Mettre à jour les coordonnées si fournies
      if (coordinates !== undefined) {
        // Récupérer les coordonnées existantes
        const existingCoordinates = await ParcelCoordinate.query({ client: trx }).where(
          'parcelId',
          parcel.id
        )

        const existingIds = existingCoordinates.map((coord) => coord.id)
        const newIds = coordinates.filter((coord) => coord.id).map((coord) => coord.id!)

        // Supprimer les coordonnées qui ne sont plus dans la liste
        const idsToDelete = existingIds.filter((coordId) => !newIds.includes(coordId))
        if (idsToDelete.length > 0) {
          await ParcelCoordinate.query({ client: trx }).whereIn('id', idsToDelete).delete()
        }

        // Traiter chaque coordonnée
        for (const coord of coordinates) {
          if (coord.id) {
            // Mettre à jour une coordonnée existante
            await ParcelCoordinate.query({ client: trx })
              .where('id', coord.id)
              .where('parcelId', parcel.id) // Sécurité : s'assurer que l'ID appartient à cette parcelle
              .update({
                latitude: coord.latitude,
                longitude: coord.longitude,
                pointOrder: coord.pointOrder,
              })
          } else {
            // Créer une nouvelle coordonnée
            await ParcelCoordinate.create(
              {
                parcelId: parcel.id,
                latitude: coord.latitude,
                longitude: coord.longitude,
                pointOrder: coord.pointOrder,
              },
              { client: trx }
            )
          }
        }
      }

      // Recharger la parcelle avec les relations mises à jour
      const updatedParcel = await Parcel.query({ client: trx })
        .where('id', parcel.id)
        .preload('producer')
        .preload('location')
        .preload('coordinates', (coordinatesQuery) => {
          coordinatesQuery.orderBy('pointOrder', 'asc')
        })
        .firstOrFail()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          const changedFields: Record<string, any> = {}
          const newValues: Record<string, any> = {}
          const oldValues: Record<string, any> = {}

          // Comparer les valeurs et enregistrer les changements
          Object.keys(data).forEach((key) => {
            if (key === 'coordinates') return // Traiter séparément

            const newValue = (data as any)[key]
            const oldValue = (originalValues as any)[key]

            if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
              changedFields[key] = newValue
              newValues[key] = newValue
              oldValues[key] = oldValue
            }
          })

          // Comparer spécifiquement les coordonnées
          if (data.coordinates !== undefined) {
            const updatedCoordinates = updatedParcel.coordinates
              ? updatedParcel.coordinates.map((coord) => ({
                  id: coord.id,
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                  pointOrder: coord.pointOrder,
                }))
              : []

            if (JSON.stringify(updatedCoordinates) !== JSON.stringify(originalValues.coordinates)) {
              changedFields.coordinates = updatedCoordinates
              newValues.coordinates = updatedCoordinates
              oldValues.coordinates = originalValues.coordinates
            }
          }

          // Enregistrer l'audit log seulement s'il y a des modifications
          if (Object.keys(changedFields).length > 0) {
            // Audit log sur l'acteur (producteur)
            await AuditLog.logAction({
              auditableType: 'Actor',
              auditableId: updatedParcel.producerId,
              action: 'update_parcel',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues,
              newValues: {
                ...newValues,
                parcel_id: updatedParcel.id,
              },
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })
          }
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
          // On ne bloque pas la mise à jour si l'audit log échoue
        }
      }

      return updatedParcel
    })
  }

  /**
   * Supprimer une parcelle (soft delete) avec audit log
   */
  async delete(
    id: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    const parcel = await this.findById(id)

    // Sauvegarder les valeurs pour l'audit log
    const oldValues = {
      producerId: parcel.producerId,
      locationCode: parcel.locationCode,
      parcelType: parcel.parcelType,
      identificationId: parcel.identificationId,
      onccId: parcel.onccId,
    }

    await parcel.delete()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Parcel',
          auditableId: parcel.id,
          action: 'delete',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues,
          newValues: { status: 'deleted' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }
  }

  /**
   * Obtenir les statistiques des parcelles
   */
  async getStats(): Promise<{
    total: number
    byType: Record<string, number>
    byLocation: Record<string, number>
  }> {
    const total = await Parcel.query().whereNull('deletedAt').count('* as total')

    const byType = await Parcel.query()
      .whereNull('deletedAt')
      .groupBy('parcelType')
      .count('* as count')
      .select('parcelType')

    const byLocation = await Parcel.query()
      .whereNull('deletedAt')
      .groupBy('locationCode')
      .count('* as count')
      .select('locationCode')

    return {
      total: Number(total[0].$extras.total),
      byType: byType.reduce(
        (acc, item) => {
          acc[item.parcelType] = Number(item.$extras.count)
          return acc
        },
        {} as Record<string, number>
      ),
      byLocation: byLocation.reduce(
        (acc, item) => {
          acc[item.locationCode] = Number(item.$extras.count)
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }

  /**
   * Activer une parcelle avec audit log
   */
  async activate(
    id: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Parcel> {
    const parcel = await this.findById(id)

    if (parcel.status === 'active') {
      throw new Error('La parcelle est déjà active')
    }

    const oldStatus = parcel.status
    parcel.status = 'active'
    await parcel.save()

    // Recharger avec les relations
    await parcel.load('producer')
    await parcel.load('location')
    await parcel.load('coordinates', (coordinatesQuery) => {
      coordinatesQuery.orderBy('pointOrder', 'asc')
    })

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        // Audit log sur l'acteur (producteur)
        await AuditLog.logAction({
          auditableType: 'Actor',
          auditableId: parcel.producerId,
          action: 'activate_parcel',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { parcel_status: oldStatus },
          newValues: {
            parcel_id: parcel.id,
            parcel_status: 'active',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return parcel
  }

  /**
   * Désactiver une parcelle avec audit log
   */
  async deactivate(
    id: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Parcel> {
    const parcel = await this.findById(id)

    if (parcel.status === 'inactive') {
      throw new Error('La parcelle est déjà inactive')
    }

    const oldStatus = parcel.status
    parcel.status = 'inactive'
    await parcel.save()

    // Recharger avec les relations
    await parcel.load('producer')
    await parcel.load('location')
    await parcel.load('coordinates', (coordinatesQuery) => {
      coordinatesQuery.orderBy('pointOrder', 'asc')
    })

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        // Audit log sur l'acteur (producteur)
        await AuditLog.logAction({
          auditableType: 'Actor',
          auditableId: parcel.producerId,
          action: 'deactivate_parcel',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { parcel_status: oldStatus },
          newValues: {
            parcel_id: parcel.id,
            parcel_status: 'inactive',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return parcel
  }

  /**
   * Valider qu'un producteur existe
   */
  private async validateProducerExists(producerId: string): Promise<void> {
    const producer = await Actor.query()
      .where('id', producerId)
      .where('actorType', 'PRODUCER')
      .whereNull('deletedAt')
      .first()

    if (!producer) {
      throw ParcelException.producerNotFound()
    }
  }

  /**
   * Valider l'unicité de l'onccId
   */
  private async validateOnccIdUnique(onccId: string): Promise<void> {
    const existingParcel = await Parcel.query()
      .where('onccId', onccId)
      .whereNull('deletedAt')
      .first()

    if (existingParcel) {
      throw ParcelException.onccIdExists()
    }
  }

  /**
   * Valider l'unicité de l'identificationId
   */
  private async validateIdentificationIdUnique(identificationId: string): Promise<void> {
    const existingParcel = await Parcel.query()
      .where('identificationId', identificationId)
      .whereNull('deletedAt')
      .first()

    if (existingParcel) {
      throw ParcelException.identificationIdExists()
    }
  }

  /**
   * Valider les parcelles avant la création d'un producteur
   * Vérifie l'unicité des onccId et identificationId
   */
  async validateParcelsForProducer(parcelsData: Omit<CreateParcelData, 'producerId'>[]): Promise<{
    valid: boolean
    errors: Array<{
      index: number
      parcelNumber: number
      field: 'onccId' | 'identificationId'
      value: string
      message: string
    }>
  }> {
    const errors: Array<{
      index: number
      parcelNumber: number
      field: 'onccId' | 'identificationId'
      value: string
      message: string
    }> = []

    // Étape 1 : Vérifier l'unicité des codes entre les parcelles en cours d'enregistrement
    const onccIdsInCurrentBatch = new Map<string, number[]>() // onccId -> array of indices
    const identificationIdsInCurrentBatch = new Map<string, number[]>() // identificationId -> array of indices

    for (const [index, parcelData] of parcelsData.entries()) {
      // Collecter les onccId
      if (parcelData.onccId) {
        if (!onccIdsInCurrentBatch.has(parcelData.onccId)) {
          onccIdsInCurrentBatch.set(parcelData.onccId, [])
        }
        onccIdsInCurrentBatch.get(parcelData.onccId)!.push(index)
      }

      // Collecter les identificationId
      if (parcelData.identificationId) {
        if (!identificationIdsInCurrentBatch.has(parcelData.identificationId)) {
          identificationIdsInCurrentBatch.set(parcelData.identificationId, [])
        }
        identificationIdsInCurrentBatch.get(parcelData.identificationId)!.push(index)
      }
    }

    // Détecter les doublons dans le lot actuel pour onccId
    for (const [onccId, indices] of onccIdsInCurrentBatch.entries()) {
      if (indices.length > 1) {
        // Convertir les indices en numéros de parcelle (1-indexed)
        const parcelNumbers = indices.map((i) => i + 1)

        // Ajouter une erreur pour chaque parcelle ayant ce doublon (sauf la première)
        for (let i = 1; i < indices.length; i++) {
          errors.push({
            index: indices[i],
            parcelNumber: indices[i] + 1,
            field: 'onccId',
            value: onccId,
            message: `Le code ONCC "${onccId}" est utilisé plusieurs fois dans les parcelles soumises (parcelles ${parcelNumbers.join(', ')})`,
          })
        }
      }
    }

    // Détecter les doublons dans le lot actuel pour identificationId
    for (const [identificationId, indices] of identificationIdsInCurrentBatch.entries()) {
      if (indices.length > 1) {
        // Convertir les indices en numéros de parcelle (1-indexed)
        const parcelNumbers = indices.map((i) => i + 1)

        // Ajouter une erreur pour chaque parcelle ayant ce doublon (sauf la première)
        for (let i = 1; i < indices.length; i++) {
          errors.push({
            index: indices[i],
            parcelNumber: indices[i] + 1,
            field: 'identificationId',
            value: identificationId,
            message: `L'identifiant unique "${identificationId}" est utilisé plusieurs fois dans les parcelles soumises (parcelles ${parcelNumbers.join(', ')})`,
          })
        }
      }
    }

    // Étape 2 : Vérifier l'unicité dans la base de données (uniquement pour les codes non-dupliqués dans le lot)
    for (const [index, parcelData] of parcelsData.entries()) {
      // Vérifier l'unicité de l'onccId dans la BD si fourni et non dupliqué dans le lot
      if (parcelData.onccId) {
        const indicesWithSameOnccId = onccIdsInCurrentBatch.get(parcelData.onccId) || []
        // Ne vérifier dans la BD que si c'est la première occurrence dans le lot
        if (indicesWithSameOnccId[0] === index) {
          const existingParcelWithOnccId = await Parcel.query()
            .where('onccId', parcelData.onccId)
            .whereNull('deletedAt')
            .first()

          if (existingParcelWithOnccId) {
            errors.push({
              index,
              parcelNumber: index + 1,
              field: 'onccId',
              value: parcelData.onccId,
              message: `Le code ONCC "${parcelData.onccId}" de la parcelle ${index + 1} existe déjà pour une autre parcelle dans la base de données`,
            })
          }
        }
      }

      // Vérifier l'unicité de l'identificationId dans la BD si fourni et non dupliqué dans le lot
      if (parcelData.identificationId) {
        const indicesWithSameIdentificationId =
          identificationIdsInCurrentBatch.get(parcelData.identificationId) || []
        // Ne vérifier dans la BD que si c'est la première occurrence dans le lot
        if (indicesWithSameIdentificationId[0] === index) {
          const existingParcelWithIdentificationId = await Parcel.query()
            .where('identificationId', parcelData.identificationId)
            .whereNull('deletedAt')
            .first()

          if (existingParcelWithIdentificationId) {
            errors.push({
              index,
              parcelNumber: index + 1,
              field: 'identificationId',
              value: parcelData.identificationId,
              message: `L'identifiant unique "${parcelData.identificationId}" de la parcelle ${index + 1} existe déjà pour une autre parcelle dans la base de données`,
            })
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
