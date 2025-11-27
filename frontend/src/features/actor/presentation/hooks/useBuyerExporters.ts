import { useCallback, useState } from 'react';
import type { ActorWithSync } from '../../domain/actor.types';
import { ActorServiceProvider } from '../../infrastructure/di/actorServiceProvider';
import { PaginationMeta } from '@/core/domain/types';

interface UseBuyerExportersResult {
  exporters: ActorWithSync[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadExporters: (params: { buyerId: string; page: number; limit: number }) => Promise<void>;
}

export const useBuyerExporters = (): UseBuyerExportersResult => {
  const [exporters, setExporters] = useState<ActorWithSync[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExporters = useCallback(
    async (params: { buyerId: string; page: number; limit: number }) => {
      setLoading(true);
      setError(null);

      try {
        const getBuyerExportersUseCase = ActorServiceProvider.getBuyerExportersUseCase();
        const result = await getBuyerExportersUseCase.execute(
          params.buyerId,
          params.page,
          params.limit
        );

        setExporters(result.actors);
        setPagination(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setExporters([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    exporters,
    pagination,
    loading,
    error,
    loadExporters,
  };
};
