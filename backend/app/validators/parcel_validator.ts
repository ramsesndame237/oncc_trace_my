import { PARCEL_STATUSES, PARCEL_TYPES } from '#types/parcel_types'
import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new parcel.
 */
export const createParcelValidator = vine.compile(
  vine.object({
    producerId: vine.string().uuid(),
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
          id: vine.string().uuid().optional(),
          latitude: vine.number().min(-90).max(90),
          longitude: vine.number().min(-180).max(180),
          pointOrder: vine.number().positive(),
        })
      )
      .minLength(1)
      .optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing parcel.
 */
export const updateParcelValidator = vine.compile(
  vine.object({
    locationCode: vine.string().minLength(1).maxLength(20).optional(),
    surfaceArea: vine.number().positive().optional(),
    parcelCreationDate: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
    parcelType: vine.enum(PARCEL_TYPES).optional(),
    identificationId: vine.string().maxLength(50).nullable().optional(),
    onccId: vine.string().maxLength(50).nullable().optional(),
    status: vine.enum(PARCEL_STATUSES).optional(),
    coordinates: vine
      .array(
        vine.object({
          id: vine.string().uuid().optional(),
          latitude: vine.number().min(-90).max(90),
          longitude: vine.number().min(-180).max(180),
          pointOrder: vine.number().positive(),
        })
      )
      .minLength(1)
      .optional(),
  })
)

/**
 * Validator to validate the payload when creating
 * multiple parcels for a specific producer.
 */
export const bulkCreateParcelForProducerValidator = vine.compile(
  vine.object({
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
            .minLength(1)
            .optional(),
        })
      )
      .minLength(1)
      .maxLength(50), // Limiter à 50 parcelles par producteur
  })
)

/**
 * Validator for parcel filtering
 */
export const parcelFilterValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(100).optional(),
    producerId: vine.string().uuid().optional(),
    locationCode: vine.string().minLength(1).maxLength(20).optional(),
    parcelType: vine.enum(PARCEL_TYPES).optional(),
    status: vine.enum(PARCEL_STATUSES).optional(),
    search: vine.string().minLength(1).optional(),
  })
)

/**
 * Validator for parcel status update
 */
export const updateParcelStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(PARCEL_STATUSES),
  })
)
