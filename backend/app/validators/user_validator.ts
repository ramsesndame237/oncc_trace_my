import vine from '@vinejs/vine'
import { USER_ROLES_ARRAY } from '#types/user_roles'

/**
 * Validation schema for updating user information
 * Supports partial updates - all fields are optional
 */
export const updateUserInfoValidator = vine.compile(
  vine.object({
    familyName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .optional(),
    givenName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(15)
      .regex(/^[\+]?[0-9\s\-\(\)]+$/)
      .optional(),
    role: vine.enum(USER_ROLES_ARRAY).optional(),
    position: vine.string().trim().minLength(2).maxLength(100).nullable().optional(),
    productionBasinId: vine.string().uuid().nullable().optional(),
    lang: vine.enum(['fr', 'en']).optional(),
  })
)

/**
 * Validation schema for updating own name (self update)
 */
export const updateSelfNameValidator = vine.compile(
  vine.object({
    type: vine.literal('name'),
    givenName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/),
    familyName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/),
  })
)

/**
 * Validation schema for updating own password (self update)
 */
export const updateSelfPasswordValidator = vine.compile(
  vine.object({
    type: vine.literal('password'),
    currentPassword: vine.string().minLength(8),
    newPassword: vine.string().minLength(8).maxLength(255),
  })
)

/**
 * Validation schema for updating other personal info (self update)
 */
export const updateSelfOtherValidator = vine.compile(
  vine.object({
    type: vine.literal('other'),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(15)
      .regex(/^[\+]?[0-9\s\-\(\)]+$/)
      .optional(),
    position: vine.string().trim().minLength(2).maxLength(100).nullable().optional(),
    lang: vine.enum(['fr', 'en']).optional(),
  })
)

/**
 * Validation schema for updating actor_manager information
 * Restriction : role et position ne peuvent pas être modifiés
 */
export const updateActorManagerValidator = vine.compile(
  vine.object({
    familyName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .optional(),
    givenName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(15)
      .regex(/^[\+]?[0-9\s\-\(\)]+$/)
      .optional(),
    lang: vine.enum(['fr', 'en']).optional(),
    // role, position et productionBasinId sont exclus
  })
)
