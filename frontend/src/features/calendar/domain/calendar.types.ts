/**
 * Types pour la feature Calendar
 * Basés sur backend/app/types/calendar_types.ts
 */

import { ActorWithSync } from "@/features/actor/domain";
import { ConventionWithSync } from "@/features/convention/domain";
import { CalendarWithSync } from "./Calendar";

/**
 * Types d'événements du calendrier
 */
export const CALENDAR_TYPES = ["MARCHE", "ENLEVEMENT"] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

/**
 * Statuts d'un événement du calendrier
 */
export const CALENDAR_STATUSES = ["active", "inactive"] as const;
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number];

/**
 * Entité Calendar du domaine (Clean Architecture)
 */
export interface Calendar {
  id: string;
  code: string;
  type: CalendarType;
  startDate: string; // ISO string
  endDate: string; // ISO string
  eventTime: string | null;
  locationCode: string | null;
  location: string | null;
  campaignId: string;
  conventionId: string | null;
  opaId: string | null;
  status: CalendarStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations (partielles car l'API ne renvoie qu'un sous-ensemble des propriétés)
  campaign?: Partial<{
    id: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  convention?: Partial<ConventionWithSync>;
  locationRelation?: Partial<{
    code: string;
    name: string;
    type: string;
  }>;
  opa?: Partial<ActorWithSync>;
}

/**
 * Filtres pour la recherche de calendriers
 */
export interface CalendarFilters {
  code?: string;
  type?: CalendarType;
  status?: CalendarStatus;
  campaignId?: string;
  conventionId?: string;
  locationCode?: string;
  location?: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  page?: number;
  perPage?: number;
}

/**
 * Données pour la création d'un calendrier
 */
export interface CreateCalendarData {
  code?: string;
  type: CalendarType;
  startDate: string; // ISO string
  endDate: string; // ISO string
  eventTime?: string;
  locationCode?: string;
  location?: string;
  campaignId: string;
  conventionId?: string;
  opaId?: string;
  status?: CalendarStatus;
}

/**
 * Données pour la mise à jour d'un calendrier
 */
export interface UpdateCalendarData {
  code?: string;
  type?: CalendarType;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  eventTime?: string;
  locationCode?: string;
  location?: string;
  campaignId?: string;
  conventionId?: string;
  opaId?: string;
  status?: CalendarStatus;
}

/**
 * Métadonnées de pagination
 */
export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

/**
 * Résultat de la liste des calendriers avec pagination
 */
export interface GetCalendarsResult {
  data: CalendarWithSync[];
  meta: PaginationMeta;
}
