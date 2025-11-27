import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new location.
 */
export const createLocationValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/)
      .unique(async (db, value) => {
        const location = await db.from('locations').where('name', value).first()
        return !location
      }),

    type: vine.enum(['region', 'department', 'district', 'village'] as const),

    code: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(10)
      .regex(/^[A-Z0-9\-]+$/)
      .unique(async (db, value) => {
        const location = await db.from('locations').where('code', value).first()
        return !location
      }),

    parentCode: vine
      .string()
      .trim()
      .exists(async (db, value) => {
        const location = await db.from('locations').where('code', value).first()
        return !!location
      })
      .optional(),

    status: vine.enum(['active', 'inactive'] as const).optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing location.
 */
export const updateLocationValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/)
      .unique(async (db, value, field) => {
        const location = await db
          .from('locations')
          .where('name', value)
          .whereNot('code', field.meta.locationCode)
          .first()
        return !location
      })
      .optional(),

    type: vine.enum(['region', 'department', 'district', 'village'] as const).optional(),

    parentCode: vine
      .string()
      .trim()
      .exists(async (db, value) => {
        const location = await db.from('locations').where('code', value).first()
        return !!location
      })
      .optional(),

    status: vine.enum(['active', 'inactive'] as const).optional(),
  })
)

/**
 * Custom error messages for location creation
 */
export const createLocationMessages = {
  'name.required': 'Le nom de la localisation est obligatoire',
  'name.minLength': 'Le nom doit contenir au moins 2 caractères',
  'name.maxLength': 'Le nom ne peut pas dépasser 100 caractères',
  'name.regex': 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  'name.unique': 'Une localisation avec ce nom existe déjà',

  'type.required': 'Le type de localisation est obligatoire',
  'type.enum': 'Le type doit être: region, department, district ou village',

  'code.required': 'Le code de la localisation est obligatoire',
  'code.minLength': 'Le code doit contenir au moins 2 caractères',
  'code.maxLength': 'Le code ne peut pas dépasser 10 caractères',
  'code.regex': 'Le code ne peut contenir que des lettres majuscules, chiffres et tirets',
  'code.unique': 'Une localisation avec ce code existe déjà',

  'parentCode.exists': "La localisation parent spécifiée n'existe pas",

  'status.enum': 'Le statut doit être: active ou inactive',
}

/**
 * Custom error messages for location update
 */
export const updateLocationMessages = {
  'name.minLength': 'Le nom doit contenir au moins 2 caractères',
  'name.maxLength': 'Le nom ne peut pas dépasser 100 caractères',
  'name.regex': 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  'name.unique': 'Une localisation avec ce nom existe déjà',

  'type.enum': 'Le type doit être: region, department, district ou village',

  'parentCode.exists': "La localisation parent spécifiée n'existe pas",

  'status.enum': 'Le statut doit être: active ou inactive',
}
