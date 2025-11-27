import { ISyncHandler } from "@/core/domain/sync.types";
import {
  CalendarFilters,
  CalendarStatus,
  CalendarWithSync,
  GetCalendarsResult,
} from "./Calendar";
import { CreateCalendarRequest, UpdateCalendarRequest } from "./types/request";

/**
 * Interface du repository Calendar
 * Définit les opérations disponibles sur les calendriers
 * Étend ISyncHandler pour le support offline
 */
export interface ICalendarRepository extends ISyncHandler {
  /**
   * Récupère tous les calendriers selon les filtres
   */
  getAll(
    filters: CalendarFilters,
    isOnline: boolean
  ): Promise<GetCalendarsResult>;

  /**
   * Récupère un calendrier par son ID
   */
  getById(id: string, isOnline: boolean): Promise<CalendarWithSync>;

  /**
   * Crée un nouveau calendrier
   */
  create(payload: CreateCalendarRequest, isOnline: boolean): Promise<void>;

  /**
   * Met à jour un calendrier
   */
  update(
    id: string,
    payload: UpdateCalendarRequest,
    editOffline?: boolean
  ): Promise<void>;

  /**
   * Met à jour le statut d'un calendrier
   */
  updateStatus(
    id: string,
    code: string,
    status: CalendarStatus
  ): Promise<CalendarWithSync>;

  /**
   * Met à jour le nombre de ventes attendues d'un calendrier
   */
  updateExpectedSalesCount(
    id: string,
    code: string,
    expectedSalesCount: number
  ): Promise<CalendarWithSync>;
}
