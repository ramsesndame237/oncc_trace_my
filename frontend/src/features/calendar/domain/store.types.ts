import { PaginationMeta } from "@/core/domain/types";
import { CalendarWithSync, CalendarFilters, CalendarStatus } from "./Calendar";
import type {
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from "./types/request";

/**
 * State du store Calendar
 */
export interface CalendarState {
  calendars: CalendarWithSync[];
  meta: PaginationMeta | null;
  filters: CalendarFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

/**
 * Actions du store Calendar
 */
export interface CalendarActions {
  setFilters: (filters: Partial<CalendarFilters>) => void;
  fetchCalendars: (forceOrFilters?: boolean | Partial<CalendarFilters>) => Promise<void>;
  fetchCalendarById: (id: string) => Promise<CalendarWithSync>;
  createCalendar: (payload: CreateCalendarRequest) => Promise<void>;
  updateCalendar: (
    id: string,
    payload: UpdateCalendarRequest,
    editOffline?: boolean
  ) => Promise<void>;
  updateStatus: (
    id: string,
    code: string,
    status: CalendarStatus
  ) => Promise<CalendarWithSync>;
  updateExpectedSalesCount: (
    id: string,
    code: string,
    expectedSalesCount: number
  ) => Promise<CalendarWithSync>;
  clearError: () => void;
}

/**
 * Store complet (State + Actions)
 */
export type CalendarStore = CalendarState & CalendarActions;
