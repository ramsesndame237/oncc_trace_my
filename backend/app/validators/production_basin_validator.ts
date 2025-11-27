import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new production basin.
 */
export const createProductionBasinValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value) => {
        const result = await db.from('production_basins').where('name', value).first()
        return !result
      }),
    description: vine.string().trim().optional(),
    locationCodes: vine
      .array(
        vine.string().exists(async (db, value) => {
          const result = await db.from('locations').where('code', value).first()
          return !!result
        })
      )
      .optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing production basin.
 */
export const updateProductionBasinValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const basinId = field.meta.basinId
        const result = await db
          .from('production_basins')
          .where('name', value)
          .whereNot('id', basinId)
          .first()
        return !result
      })
      .optional(),
    description: vine.string().trim().optional(),
    locationCodes: vine
      .array(
        vine.string().exists(async (db, value) => {
          const result = await db.from('locations').where('code', value).first()
          return !!result
        })
      )
      .optional(),
  })
)
