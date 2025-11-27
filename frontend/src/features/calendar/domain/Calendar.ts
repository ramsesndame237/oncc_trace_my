/**
 * Type principal Calendar (Domain Entity)
 * Correspond au modèle backend Calendar
 */

import { ISyncStatus } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";
import { ActorWithSync } from "@/features/actor/domain";
import { CampaignWithSync } from "@/features/campaign";
import { ConventionWithSync } from "@/features/convention/domain";
import { LocationWithSync } from "@/features/location";

/**
 * Types de calendrier
 */
export const CALENDAR_TYPES = ["MARCHE", "ENLEVEMENT"] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

/**
 * Statuts de calendrier
 */
export const CALENDAR_STATUSES = ["active", "inactive"] as const;
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number];

/**
 * Calendar Entity (Domain)
 */
export interface Calendar {
  id: string;
  code: string;
  type: CalendarType;
  startDate: string;
  endDate: string;
  eventTime: string | null;
  locationCode: string | null;
  location: string | null;
  campaignId: string;
  conventionId: string | null;
  opaId: string | null;
  expectedSalesCount: number | null;
  status: CalendarStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations
  campaign?: CampaignWithSync;
  convention?: ConventionWithSync;
  locationRelation?: LocationWithSync;
  opa?: ActorWithSync;
}

/**
 * Calendar avec métadonnées de synchronisation (pour offline)
 */
export interface CalendarWithSync extends Calendar {
  syncStatus?: ISyncStatus;
}

/**
 * Filtres pour la liste des calendriers
 */
export interface CalendarFilters {
  page?: number;
  per_page?: number;
  type?: CalendarType;
  status?: CalendarStatus;
  campaignId?: string;
  conventionId?: string;
  opaId?: string;
  locationCode?: string;
  startDate?: string;
  endDate?: string;
  period?: number;
  search?: string;
}

/**
 * Résultat de la requête getAll
 */
export interface GetCalendarsResult {
  calendars: CalendarWithSync[];
  meta: PaginationMeta;
}
