import vine from '@vinejs/vine'

/**
 * Validator for creating a new store
 */
export const createStoreValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    code: vine.string().trim().minLength(2).maxLength(20).optional(),
    storeType: vine.enum(['EXPORT', 'GROUPING', 'GROUPING_AND_MACHINING']),
    capacity: vine.number().positive().optional(),
    surfaceArea: vine.number().positive().optional(),
    locationCode: vine.string().trim().minLength(1).maxLength(10),
    status: vine.enum(['active', 'inactive']).optional(),
  })
)

/**
 * Validator for updating an existing store
 */
export const updateStoreValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    code: vine.string().trim().minLength(2).maxLength(20).optional(),
    storeType: vine.enum(['EXPORT', 'GROUPING', 'GROUPING_AND_MACHINING']).optional(),
    capacity: vine.number().positive().optional(),
    surfaceArea: vine.number().positive().optional(),
    locationCode: vine.string().trim().minLength(1).maxLength(10).optional(),
  })
)
