import { CALENDAR_STATUSES, CALENDAR_TYPES } from '#types/calendar_types'
import vine from '@vinejs/vine'

/**
 * Validator pour la création d'un calendrier
 */
export const createCalendarValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(100).optional(), // Optionnel - généré automatiquement
    type: vine.enum(CALENDAR_TYPES),
    startDate: vine.date({
      formats: ['YYYY-MM-DD', 'ISO'],
    }),
    endDate: vine.date({
      formats: ['YYYY-MM-DD', 'ISO'],
    }),
    eventTime: vine
      .string()
      .trim()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .optional(), // Format HH:MM ou HH:MM:SS // Format HH:MM
    locationCode: vine.string().trim().maxLength(20).optional(), // Code de la location
    location: vine.string().trim().optional(), // Description du lieu de l'événement
    campaignId: vine.string().uuid().optional(), // Optionnel - requis pour type ENLEVEMENT
    conventionId: vine.string().uuid().optional(), // Requis pour type ENLEVEMENT
    opaId: vine.string().uuid().optional(), // UUID de l'acteur OPA - requis pour type MARCHE
    expectedSalesCount: vine.number().min(0).optional(), // Nombre de ventes attendues (uniquement pour type MARCHE)
    status: vine.enum(CALENDAR_STATUSES).optional(),
  })
)

/**
 * Validator pour la mise à jour d'un calendrier
 */
export const updateCalendarValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(100).optional(),
    type: vine.enum(CALENDAR_TYPES).optional(),
    startDate: vine
      .date({
        formats: ['YYYY-MM-DD', 'ISO'],
      })
      .optional(),
    endDate: vine
      .date({
        formats: ['YYYY-MM-DD', 'ISO'],
      })
      .optional(),
    eventTime: vine
      .string()
      .trim()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .optional(), // Format HH:MM ou HH:MM:SS
    locationCode: vine.string().trim().maxLength(20).optional(), // Code de la location
    location: vine.string().trim().optional(), // Description du lieu de l'événement
    campaignId: vine.string().uuid().optional(),
    conventionId: vine.string().uuid().optional(),
    opaId: vine.string().uuid().optional(), // UUID de l'acteur OPA
    expectedSalesCount: vine.number().min(0).optional(), // Nombre de ventes attendues (uniquement pour type MARCHE)
    status: vine.enum(CALENDAR_STATUSES).optional(),
  })
)

/**
 * Validator pour la mise à jour du statut d'un calendrier
 */
export const updateCalendarStatusValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1),
    status: vine.enum(CALENDAR_STATUSES),
  })
)

/**
 * Validator pour la mise à jour du nombre de ventes attendues
 */
export const updateExpectedSalesCountValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1),
    expectedSalesCount: vine.number().min(0),
  })
)

/**
 * Validator pour les filtres de recherche de calendriers
 */
export const calendarFiltersValidator = vine.compile(
  vine.object({
    search: vine.string().trim().optional(),
    code: vine.string().trim().optional(),
    type: vine.enum(CALENDAR_TYPES).optional(),
    status: vine.enum(CALENDAR_STATUSES).optional(),
    campaignId: vine.string().uuid().optional(),
    conventionId: vine.string().uuid().optional(),
    locationCode: vine.string().trim().optional(),
    location: vine.string().trim().optional(),
    startDate: vine
      .date({
        formats: ['YYYY-MM-DD', 'ISO'],
      })
      .optional(),
    endDate: vine
      .date({
        formats: ['YYYY-MM-DD', 'ISO'],
      })
      .optional(),
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
  })
)
