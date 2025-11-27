import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCallback, useEffect, useState } from "react";
import { Convention } from "../../domain/types";
import { ConventionServiceProvider } from "../../infrastructure/di/conventionServiceProvider";

export function useGetConventionById(id: string) {
  const [convention, setConvention] = useState<Convention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const getConventionByIdUseCase =
    ConventionServiceProvider.getGetConventionByIdUseCase();

  const fetchConvention = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID de convention invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedConvention = await getConventionByIdUseCase.execute(
        id,
        isOnline
      );
      setConvention(fetchedConvention);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la convention"
      );
      setConvention(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getConventionByIdUseCase]);

  useEffect(() => {
    fetchConvention();
  }, [fetchConvention]);

  return {
    convention,
    isLoading,
    error,
    refetch: fetchConvention,
  };
}
