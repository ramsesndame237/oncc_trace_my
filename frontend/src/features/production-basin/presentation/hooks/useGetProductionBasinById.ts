import { useEffect, useState } from "react";
import type { ProductionBasinWithSync } from "../../domain/productionBasin.types";
import { ProductionBasinServiceProvider } from "../../infrastructure/di/productionBasinServiceProvider";

interface UseGetProductionBasinByIdResult {
  basin: ProductionBasinWithSync | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook pour récupérer un bassin de production spécifique par son ID
 * @param id - ID du bassin à récupérer
 * @returns L'état de récupération du bassin
 */
export const useGetProductionBasinById = (
  id: string,
  isOnline: boolean = true
): UseGetProductionBasinByIdResult => {
  const [basin, setBasin] = useState<ProductionBasinWithSync | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBasin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const useCase =
        ProductionBasinServiceProvider.getGetProductionBasinByIdUseCase();
      const result = await useCase.execute(id, isOnline);

      setBasin(result);
    } catch (err) {
      console.error("Erreur lors de la récupération du bassin:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du bassin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBasin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOnline]);

  const refetch = () => {
    if (id) {
      fetchBasin();
    }
  };

  return {
    basin,
    isLoading,
    error,
    refetch,
  };
};
