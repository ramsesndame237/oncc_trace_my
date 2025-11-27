import { useCallback, useState } from 'react';
import type { ActorWithSync } from '../../domain/actor.types';
import { ActorServiceProvider } from '../../infrastructure/di/actorServiceProvider';
import { PaginationMeta } from '@/core/domain/types';

interface UseOpaProducersResult {
  producers: ActorWithSync[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadProducers: (params: { opaId: string; page: number; limit: number }) => Promise<void>;
}

export const useOpaProducers = (): UseOpaProducersResult => {
  const [producers, setProducers] = useState<ActorWithSync[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducers = useCallback(
    async (params: { opaId: string; page: number; limit: number }) => {
      setLoading(true);
      setError(null);

      try {
        const getOpaProducersUseCase = ActorServiceProvider.getOpaProducersUseCase();
        const result = await getOpaProducersUseCase.execute(
          params.opaId,
          params.page,
          params.limit
        );

        setProducers(result.actors);
        setPagination(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setProducers([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    producers,
    pagination,
    loading,
    error,
    loadProducers,
  };
};
