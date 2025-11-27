import { CalendarType, CalendarStatus } from "../Calendar";

/**
 * Payload pour la création d'un calendrier de type MARCHE
 */
export interface CreateCalendarRequest {
  code?: string; // Optionnel - sera généré automatiquement si non fourni
  type: CalendarType;
  startDate: string;
  endDate: string;
  eventTime?: string;
  locationCode?: string;
  location?: string;
  opaId?: string; // Pour MARCHE: requis, pour ENLEVEMENT: optionnel
  campaignId?: string; // Pour ENLEVEMENT: requis, pour MARCHE: optionnel
  conventionId?: string; // Pour ENLEVEMENT uniquement
  expectedSalesCount?: number;
  status?: CalendarStatus;
}

/**
 * Payload pour la mise à jour d'un calendrier
 */
export interface UpdateCalendarRequest {
  code?: string;
  type?: CalendarType;
  startDate?: string;
  endDate?: string;
  eventTime?: string;
  locationCode?: string;
  location?: string;
  opaId?: string;
  campaignId?: string;
  conventionId?: string;
  expectedSalesCount?: number;
  status?: CalendarStatus;
}
