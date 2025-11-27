import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Location from '#models/location'
import Store from '#models/store'
import { StoreErrorCodes } from '#types/errors/store'
import { Exception } from '@adonisjs/core/exceptions'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

export interface CreateStoreData {
  name: string
  code?: string
  storeType: string
  locationCode: string
  capacity?: number
  surfaceArea?: number
}

export interface UpdateStoreData {
  name?: string
  code?: string
  storeType?: string
  locationCode?: string
  capacity?: number
  surfaceArea?: number
}

export default class StoreService {
  /**
   * Génère un code unique pour un nouveau magasin
   * Format: ST-YYYY-XXXXX (ST pour Store, année, numéro séquentiel)
   * @param storeType Type de magasin (optionnel, pour personnaliser le préfixe)
   * @returns Le code généré
   */
  private async generateUniqueCode(storeType?: string): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = this.getPrefix(storeType)

    // Trouver le dernier code généré cette année pour ce type
    const lastStore = await Store.query()
      .where('code', 'like', `${prefix}-${currentYear}-%`)
      .orderBy('code', 'desc')
      .first()

    let nextNumber = 1

    if (lastStore?.code) {
      // Extraire le numéro séquentiel du dernier code
      const lastNumber = Number.parseInt(lastStore.code.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }

    // Générer le nouveau code avec padding à 5 chiffres
    const paddedNumber = nextNumber.toString().padStart(5, '0')
    const newCode = `${prefix}-${currentYear}-${paddedNumber}`

    // Vérifier l'unicité (sécurité supplémentaire)
    const existingStore = await Store.findBy('code', newCode)
    if (existingStore) {
      // Si par hasard le code existe déjà, essayer le suivant
      return this.generateUniqueCode(storeType)
    }

    return newCode
  }

  /**
   * Détermine le préfixe basé sur le type de magasin
   * @param storeType Type de magasin
   * @returns Le préfixe approprié
   */
  private getPrefix(storeType?: string): string {
    if (!storeType) return 'ST'

    switch (storeType.toUpperCase()) {
      case 'EXPORT':
        return 'EX'
      case 'GROUPAGE':
        return 'GP'
      case 'GROUPAGE_ET_USINAGE':
        return 'GU'
      default:
        return 'ST'
    }
  }

  /**
   * Valide si un code est dans le bon format
   * @param code Le code à valider
   * @returns true si le format est valide
   */
  isValidFormat(code: string): boolean {
    // Format: XX-YYYY-NNNNN
    const regex = /^[A-Z]{2}-\d{4}-\d{5}$/
    return regex.test(code)
  }

  /**
   * Vérifie si un code est disponible (n'existe pas déjà)
   * @param code Le code à vérifier
   * @returns true si le code est disponible
   */
  async isCodeAvailable(code: string): Promise<boolean> {
    const existingStore = await Store.findBy('code', code)
    return !existingStore
  }

  /**
   * Créer un nouveau magasin avec audit log
   */
  async create(
    data: CreateStoreData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Store> {
    // Vérifier que la localisation existe
    const location = await Location.find(data.locationCode)
    if (!location) {
      throw new Exception('Localisation non trouvée', {
        code: 'LOCATION_NOT_FOUND',
        status: 404,
      })
    }

    // Gérer le code du magasin
    let storeCode = data.code

    if (storeCode) {
      // Si un code est fourni, vérifier son unicité
      const existingStore = await Store.findBy('code', storeCode)
      if (existingStore) {
        throw new Exception('Un magasin avec ce code existe déjà', {
          code: StoreErrorCodes.STORE_CODE_EXISTS,
          status: 409,
        })
      }
    } else {
      // Si aucun code n'est fourni, en générer un automatiquement
      storeCode = await this.generateUniqueCode(data.storeType)
    }

    // Créer le magasin
    const store = await Store.create({
      ...data,
      code: storeCode,
    })

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Store',
          auditableId: store.id,
          action: 'create',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: null,
          newValues: {
            name: store.name,
            code: store.code,
            storeType: store.storeType,
            locationCode: store.locationCode,
            capacity: store.capacity,
            surfaceArea: store.surfaceArea,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return store
  }

  /**
   * Mettre à jour un magasin avec audit log
   */
  async update(
    id: string,
    data: UpdateStoreData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Store> {
    const store = await Store.findOrFail(id)

    // Sauvegarder les valeurs originales pour l'audit log
    const originalValues = {
      name: store.name,
      code: store.code,
      storeType: store.storeType,
      locationCode: store.locationCode,
      capacity: store.capacity,
      surfaceArea: store.surfaceArea,
    }

    // Si un nouveau code est fourni, vérifier son unicité
    if (data.code && data.code !== store.code) {
      const existingStore = await Store.query().where('code', data.code).whereNot('id', id).first()

      if (existingStore) {
        throw new Exception('Un magasin avec ce code existe déjà', {
          code: StoreErrorCodes.STORE_CODE_EXISTS,
          status: 409,
        })
      }
    }

    // Si locationCode est modifié, vérifier que la nouvelle localisation existe
    if (data.locationCode && data.locationCode !== store.locationCode) {
      const location = await Location.find(data.locationCode)
      if (!location) {
        throw new Exception('Localisation non trouvée', {
          code: StoreErrorCodes.LOCATION_NOT_FOUND,
          status: 404,
        })
      }
    }

    // Mettre à jour les champs fournis
    if (data.name !== undefined) store.name = data.name
    if (data.code !== undefined) store.code = data.code
    if (data.storeType !== undefined) store.storeType = data.storeType
    if (data.locationCode !== undefined) store.locationCode = data.locationCode
    if (data.capacity !== undefined) store.capacity = data.capacity
    if (data.surfaceArea !== undefined) store.surfaceArea = data.surfaceArea

    await store.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        const changedFields: Record<string, any> = {}
        const newValues: Record<string, any> = {}
        const oldValues: Record<string, any> = {}

        // Comparer les valeurs et enregistrer les changements
        Object.keys(data).forEach((key) => {
          const newValue = (data as any)[key]
          const oldValue = (originalValues as any)[key]

          if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            changedFields[key] = newValue
            newValues[key] = newValue
            oldValues[key] = oldValue
          }
        })

        // Enregistrer l'audit log seulement s'il y a des modifications
        if (Object.keys(changedFields).length > 0) {
          await AuditLog.logAction({
            auditableType: 'Store',
            auditableId: store.id,
            action: 'update',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues,
            newValues,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        }
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return store
  }

  /**
   * Récupérer un magasin par son ID
   */
  async findById(id: string): Promise<Store> {
    return await Store.findOrFail(id)
  }

  /**
   * Ajouter un occupant à un magasin
   */
  async addOccupant(
    storeId: string,
    actorId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    const store = await Store.findOrFail(storeId)

    // Vérifier si l'acteur existe

    const actor = await Actor.findOrFail(actorId)

    // Ajouter l'occupant (si déjà présent, Lucid ne fera rien grâce au unique constraint)
    await store.related('occupants').attach([actorId])

    // Mettre à jour le updated_at de l'acteur pour la synchronisation
    actor.updatedAt = DateTime.now()
    await actor.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Store',
          auditableId: store.id,
          action: 'add_occupant',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: null,
          newValues: {
            actorId: actor.id,
            actorName: `${actor.givenName} ${actor.familyName}`,
            actorType: actor.actorType,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }

      // Émettre l'événement d'affectation d'occupant (asynchrone, en arrière-plan)
      emitter.emit('occupant:assigned', {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
        },
        actor: {
          id: actor.id,
          fullName: `${actor.givenName} ${actor.familyName}`,
          actorType: actor.actorType,
          email: actor.email,
        },
        assignedBy: {
          id: auditContext.userId,
          username: auditContext.userId,
          fullName: auditContext.userId,
        },
      })
    }
  }

  /**
   * Retirer un occupant d'un magasin
   */
  async removeOccupant(
    storeId: string,
    actorId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    const store = await Store.findOrFail(storeId)

    // Vérifier si l'acteur existe
    const actor = await Actor.findOrFail(actorId)

    // Retirer l'occupant
    await store.related('occupants').detach([actorId])

    // Mettre à jour le updated_at de l'acteur pour la synchronisation
    actor.updatedAt = DateTime.now()
    await actor.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Store',
          auditableId: store.id,
          action: 'remove_occupant',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: {
            actorId: actor.id,
            actorName: `${actor.givenName} ${actor.familyName}`,
            actorType: actor.actorType,
          },
          newValues: null,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }

      // Émettre l'événement de dissociation d'occupant (asynchrone, en arrière-plan)
      emitter.emit('occupant:unassigned', {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
        },
        actor: {
          id: actor.id,
          fullName: `${actor.givenName} ${actor.familyName}`,
          actorType: actor.actorType,
          email: actor.email,
        },
        unassignedBy: {
          id: auditContext.userId,
          username: auditContext.userId,
          fullName: auditContext.userId,
        },
      })
    }
  }

  /**
   * Récupérer la liste des occupants d'un magasin
   */
  async getOccupants(storeId: string): Promise<any[]> {
    const store = await Store.query()
      .where('id', storeId)
      .preload('occupants', (query) => {
        query.select(
          'id',
          'actor_type',
          'family_name',
          'given_name',
          'phone',
          'email',
          'status',
          'location_code'
        )
      })
      .firstOrFail()

    return store.occupants.map((occupant) => occupant.serialize())
  }
}
