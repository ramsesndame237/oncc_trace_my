import type { DateTime } from 'luxon'

/**
 * Types d'événements du calendrier
 */
export const CALENDAR_TYPES = ['MARCHE', 'ENLEVEMENT'] as const
export type CalendarType = (typeof CALENDAR_TYPES)[number]

/**
 * Statuts d'un événement du calendrier
 */
export const CALENDAR_STATUSES = ['active', 'inactive'] as const
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number]

/**
 * Données pour la création d'un calendrier
 */
export interface CreateCalendarData {
  code?: string // Optionnel - sera généré automatiquement si non fourni
  type: CalendarType
  startDate: DateTime
  endDate: DateTime
  eventTime?: string
  locationCode?: string
  location?: string
  campaignId?: string // Optionnel - utilise la campagne active si non fourni
  conventionId?: string
  opaId?: string // UUID de l'acteur OPA
  expectedSalesCount?: number // Nombre de ventes attendues (uniquement pour type MARCHE)
  status?: CalendarStatus
}

/**
 * Données pour la mise à jour d'un calendrier
 */
export interface UpdateCalendarData {
  code?: string
  type?: CalendarType
  startDate?: DateTime
  endDate?: DateTime
  eventTime?: string
  locationCode?: string
  location?: string
  campaignId?: string
  conventionId?: string
  opaId?: string // UUID de l'acteur OPA
  expectedSalesCount?: number // Nombre de ventes attendues (uniquement pour type MARCHE)
  status?: CalendarStatus
}

/**
 * Filtres pour la recherche de calendriers
 */
export interface CalendarFilters {
  search?: string
  code?: string
  type?: CalendarType
  status?: CalendarStatus
  campaignId?: string
  conventionId?: string
  locationCode?: string
  location?: string
  startDate?: DateTime
  endDate?: DateTime
  page?: number
  perPage?: number
}
