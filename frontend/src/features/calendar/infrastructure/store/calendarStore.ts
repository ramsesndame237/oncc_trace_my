import { ApiError } from "@/core/infrastructure/api/client";
import { getErrorTranslationKey } from "@/i18n/utils/getErrorMessage";
import i18next from "i18next";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarStatus } from "../../domain/Calendar";
import type {
  CalendarFilters,
  CalendarState,
  CalendarStore,
} from "../../domain/store.types";
import type {
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from "../../domain/types/request";
import { CalendarErrorCodes } from "../../domain/types/codes";
import { CalendarServiceProvider } from "../di/calendarServiceProvider";

const initialState: CalendarState = {
  calendars: [],
  meta: null,
  filters: {
    page: 1,
    per_page: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...filters };

        // Clean up only null and undefined values, keep empty strings
        Object.keys(updatedFilters).forEach((key) => {
          const value = updatedFilters[key as keyof CalendarFilters];
          if (value === null || value === undefined) {
            delete updatedFilters[key as keyof CalendarFilters];
          }
        });

        set({ filters: updatedFilters });

        // Auto-trigger data refresh
        get().fetchCalendars().catch(console.error);
      },

      fetchCalendars: async (forceOrFilters) => {
        const state = get();

        // Determiner si c'est un force (boolean) ou des filtres
        const isForce =
          typeof forceOrFilters === "boolean" ? forceOrFilters : false;
        const additionalFilters =
          typeof forceOrFilters === "object" ? forceOrFilters : {};

        if (state.isLoading && !isForce) return;

        set({ isLoading: true, error: null });

        try {
          const getCalendarsUseCase =
            CalendarServiceProvider.getGetCalendarsUseCase();
          const filtersToUse = { ...state.filters, ...additionalFilters };
          const result = await getCalendarsUseCase.execute(
            filtersToUse,
            state.isOnline
          );

          set({
            calendars: result.calendars,
            meta: result.meta,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          let errorMessage: string;

          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = i18next.t("errors:calendar.CALENDAR_LIST_FAILED");
          }

          set({ error: errorMessage, isLoading: false });
        }
      },

      fetchCalendarById: async (id) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const getCalendarByIdUseCase =
            CalendarServiceProvider.getGetCalendarByIdUseCase();
          const calendar = await getCalendarByIdUseCase.execute(
            id,
            state.isOnline
          );

          // Optionnel: Ajouter ou mettre a jour le calendrier dans la liste
          const existingIndex = state.calendars.findIndex((c) => c.id === id);
          if (existingIndex !== -1) {
            const updatedCalendars = [...state.calendars];
            updatedCalendars[existingIndex] = calendar;
            set({ calendars: updatedCalendars });
          } else {
            set({ calendars: [...state.calendars, calendar] });
          }

          set({ isLoading: false, error: null });
          return calendar;
        } catch (error) {
          let errorMessage: string;

          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = i18next.t("errors:calendar.CALENDAR_SHOW_FAILED");
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      createCalendar: async (payload: CreateCalendarRequest) => {
        const state = get();

        set({ isLoading: true, error: null });

        try {
          const createCalendarUseCase =
            CalendarServiceProvider.getCreateCalendarUseCase();
          await createCalendarUseCase.execute(payload, state.isOnline);

          set({ isLoading: false });

          // Refresh the list to include the new calendar
          await get().fetchCalendars(true);
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              CalendarErrorCodes.CALENDAR_CREATE_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateCalendar: async (
        id: string,
        payload: UpdateCalendarRequest,
        editOffline?: boolean
      ) => {
        set({ isLoading: true, error: null });

        try {
          const updateCalendarUseCase =
            CalendarServiceProvider.getUpdateCalendarUseCase();
          await updateCalendarUseCase.execute(
            id,
            payload,
            editOffline
          );

          set({ isLoading: false });

          // Refresh the list to include the updates (sauf si editOffline)
          if (!editOffline) {
            await get().fetchCalendars(true);
          }
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              CalendarErrorCodes.CALENDAR_UPDATE_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateStatus: async (id: string, code: string, status: CalendarStatus) => {
        set({ isLoading: true, error: null });

        try {
          const updateCalendarStatusUseCase =
            CalendarServiceProvider.getUpdateCalendarStatusUseCase();
          const updatedCalendar = await updateCalendarStatusUseCase.execute(
            id,
            code,
            status
          );

          // Mettre à jour le calendrier dans la liste
          const state = get();
          const existingIndex = state.calendars.findIndex((c) => c.id === id);
          if (existingIndex !== -1) {
            const updatedCalendars = [...state.calendars];
            updatedCalendars[existingIndex] = updatedCalendar;
            set({ calendars: updatedCalendars });
          }

          set({ isLoading: false });
          return updatedCalendar;
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              CalendarErrorCodes.CALENDAR_STATUS_UPDATE_FAILED
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateExpectedSalesCount: async (
        id: string,
        code: string,
        expectedSalesCount: number
      ) => {
        set({ isLoading: true, error: null });

        try {
          const updateExpectedSalesCountUseCase =
            CalendarServiceProvider.getUpdateExpectedSalesCountUseCase();
          const updatedCalendar = await updateExpectedSalesCountUseCase.execute(
            id,
            code,
            expectedSalesCount
          );

          // Mettre à jour le calendrier dans la liste
          const state = get();
          const existingIndex = state.calendars.findIndex((c) => c.id === id);
          if (existingIndex !== -1) {
            const updatedCalendars = [...state.calendars];
            updatedCalendars[existingIndex] = updatedCalendar;
            set({ calendars: updatedCalendars });
          }

          set({ isLoading: false });
          return updatedCalendar;
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = i18next.t("calendar:modals.updateExpectedSalesCount.error");
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "calendar-filters-storage",
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// Listeners pour les changements de connexion
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useCalendarStore.setState({ isOnline: true });
    // Auto-refresh quand la connexion revient
    useCalendarStore.getState().fetchCalendars().catch(console.error);
  });

  window.addEventListener("offline", () => {
    useCalendarStore.setState({ isOnline: false });
  });
}
