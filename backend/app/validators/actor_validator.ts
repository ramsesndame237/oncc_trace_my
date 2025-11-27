import { ACTOR_STATUSES, ACTOR_TYPES } from '#types/actor_types'
import { PARCEL_STATUSES, PARCEL_TYPES } from '#types/parcel_types'
import vine from '@vinejs/vine'

/**
 * Validator for creating a new actor
 */
export const createActorValidator = vine.compile(
  vine.object({
    actorType: vine.enum(ACTOR_TYPES),
    familyName: vine.string().trim().minLength(2).maxLength(200),
    givenName: vine.string().trim().minLength(2).maxLength(100),
    phone: vine.string().trim().minLength(8).maxLength(20).optional(),
    email: vine.string().email().optional(),
    onccId: vine.string().trim().minLength(2).maxLength(100).optional(),
    identifiantId: vine.string().trim().minLength(2).maxLength(100).optional(),
    locationCode: vine.string().trim().minLength(1).maxLength(20).optional(),
    managerInfo: vine
      .object({
        nom: vine.string().trim().minLength(2).maxLength(100),
        prenom: vine.string().trim().minLength(2).maxLength(100),
        phone: vine.string().trim().minLength(8).maxLength(20).optional(),
        email: vine.string().email(),
      })
      .allowUnknownProperties()
      .optional(),
    status: vine.enum(ACTOR_STATUSES).optional(),
    metadata: vine.record(vine.string().nullable()).optional(),
    // Champs pour la déclaration d'existence (OPA uniquement)
    existenceDeclarationDate: vine
      .date({ formats: ['YYYY-MM-DD'] })
      .optional()
      .nullable(),
    existenceDeclarationCode: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .optional()
      .nullable(),
    existenceDeclarationYears: vine.number().in([2, 5]).optional().nullable(),
    // Producteurs membres de l'OPA (pour actorType === 'PRODUCERS')
    producers: vine
      .array(
        vine.object({
          producerId: vine.string().uuid(),
          membershipDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .nullable(),
          status: vine.enum(['active', 'inactive']).optional(),
        })
      )
      .optional(),
    // Acheteurs mandataires de l'exportateur (pour actorType === 'EXPORTER')
    buyers: vine
      .array(
        vine.object({
          buyerId: vine.string().uuid(),
          mandateDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .nullable(),
          status: vine.enum(['active', 'inactive']).optional(),
        })
      )
      .optional(),
    parcels: vine
      .array(
        vine.object({
          locationCode: vine.string().minLength(1).maxLength(20),
          surfaceArea: vine.number().positive().optional(),
          parcelCreationDate: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
          parcelType: vine.enum(PARCEL_TYPES),
          identificationId: vine.string().minLength(1).maxLength(50).optional(),
          onccId: vine.string().minLength(1).maxLength(50).optional(),
          status: vine.enum(PARCEL_STATUSES).optional(),
          coordinates: vine
            .array(
              vine.object({
                latitude: vine.number().min(-90).max(90),
                longitude: vine.number().min(-180).max(180),
                pointOrder: vine.number().positive(),
              })
            )
            .optional(),
        })
      )
      .optional(),
  })
)

/**
 * Validator for updating an existing actor
 */
export const updateActorValidator = vine.compile(
  vine.object({
    actorType: vine.enum(ACTOR_TYPES).optional(),
    familyName: vine.string().trim().minLength(2).maxLength(200).optional(),
    givenName: vine.string().trim().minLength(2).maxLength(100).optional(),
    phone: vine.string().trim().minLength(8).maxLength(20).optional(),
    email: vine.string().email().optional(),
    onccId: vine.string().trim().minLength(2).maxLength(100).optional(),
    identifiantId: vine.string().trim().minLength(2).maxLength(100).optional(),
    locationCode: vine.string().trim().minLength(1).maxLength(20).optional(),
    managerInfo: vine
      .object({
        nom: vine.string().trim().minLength(2).maxLength(100),
        prenom: vine.string().trim().minLength(2).maxLength(100),
        phone: vine.string().trim().minLength(8).maxLength(20).optional(),
        email: vine.string().email(),
      })
      .allowUnknownProperties()
      .optional(),
    metadata: vine.record(vine.string().nullable()).optional(),
    // Champs pour la déclaration d'existence (OPA uniquement)
    existenceDeclarationDate: vine
      .date({ formats: ['YYYY-MM-DD'] })
      .optional()
      .nullable(),
    existenceDeclarationCode: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .optional()
      .nullable(),
    existenceDeclarationYears: vine.number().in([2, 5]).optional().nullable(),
  })
)

/**
 * Validator for changing actor status
 */
export const updateActorStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(ACTOR_STATUSES),
  })
)

/**
 * Validator for adding a producer to an OPA
 */
export const addProducerToOpaValidator = vine.compile(
  vine.object({
    membershipDate: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
    status: vine.enum(['active', 'inactive']).optional(),
    // Support pour l'ajout en masse de producteurs
    producerIds: vine.array(vine.string().uuid()).optional(),
  })
)

/**
 * Validator for removing a producer from an OPA
 * No body needed - IDs come from URL params
 */
export const removeProducerFromOpaValidator = vine.compile(vine.object({}))

/**
 * Validator for adding a buyer to an exporter
 */
export const addBuyerToExporterValidator = vine.compile(
  vine.object({
    mandateDate: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
    status: vine.enum(['active', 'inactive']).optional(),
    // Support pour l'ajout en masse de buyers
    buyerIds: vine.array(vine.string().uuid()).optional(),
  })
)

/**
 * Validator for removing a buyer from an exporter
 * No body needed - IDs come from URL params
 */
export const removeBuyerFromExporterValidator = vine.compile(vine.object({}))
