import { PaginationMeta } from "@/core/domain/types";

/**
 * Réponse API pour un calendrier
 */
export interface CalendarResponse {
  id: string;
  code: string;
  type: "MARCHE" | "ENLEVEMENT";
  startDate: string;
  endDate: string;
  eventTime: string | null;
  locationCode: string | null;
  location: string | null;
  campaignId: string;
  conventionId: string | null;
  opaId: string;
  expectedSalesCount: number | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations
  campaign?: {
    id: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  convention?: {
    id: string;
    code: string;
    signatureDate: string;
    status: string;
  };
  locationRelation?: {
    code: string;
    name: string;
    type: string;
  };
  opa?: {
    id: string;
    familyName: string;
    givenName: string;
    actorType: string;
  };
}

/**
 * Réponse paginée pour la liste des calendriers
 */
export interface PaginatedCalendarsResponse {
  data: CalendarResponse[];
  meta: PaginationMeta;
}
