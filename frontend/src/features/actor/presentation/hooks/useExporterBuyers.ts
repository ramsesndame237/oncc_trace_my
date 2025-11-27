import { useCallback, useState } from 'react';
import type { ActorWithSync } from '../../domain/actor.types';
import { ActorServiceProvider } from '../../infrastructure/di/actorServiceProvider';
import { PaginationMeta } from '@/core/domain/types';

interface UseExporterBuyersResult {
  buyers: ActorWithSync[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadBuyers: (params: { exporterId: string; page: number; limit: number }) => Promise<void>;
}

export const useExporterBuyers = (): UseExporterBuyersResult => {
  const [buyers, setBuyers] = useState<ActorWithSync[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBuyers = useCallback(
    async (params: { exporterId: string; page: number; limit: number }) => {
      setLoading(true);
      setError(null);

      try {
        const getExporterBuyersUseCase = ActorServiceProvider.getExporterBuyersUseCase();
        const result = await getExporterBuyersUseCase.execute(
          params.exporterId,
          params.page,
          params.limit
        );

        setBuyers(result.actors);
        setPagination(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setBuyers([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    buyers,
    pagination,
    loading,
    error,
    loadBuyers,
  };
};
