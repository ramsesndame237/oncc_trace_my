import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCallback, useEffect, useState } from "react";
import { Calendar } from "../../domain/types";
import { CalendarServiceProvider } from "../../infrastructure/di/calendarServiceProvider";

export function useGetCalendarById(id: string) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const getCalendarByIdUseCase =
    CalendarServiceProvider.getGetCalendarByIdUseCase();

  const fetchCalendar = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID de calendrier invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedCalendar = await getCalendarByIdUseCase.execute(
        id,
        isOnline
      );
      setCalendar(fetchedCalendar);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du calendrier"
      );
      setCalendar(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getCalendarByIdUseCase]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return {
    calendar,
    isLoading,
    error,
    refetch: fetchCalendar,
  };
}
