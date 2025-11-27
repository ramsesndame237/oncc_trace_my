import { useCallback, useState } from 'react';
import type { ActorWithSync } from '../../domain/actor.types';
import { ActorServiceProvider } from '../../infrastructure/di/actorServiceProvider';
import { PaginationMeta } from '@/core/domain/types';

interface UseProducerOpasResult {
  opas: ActorWithSync[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadOpas: (params: { producerId: string; page: number; limit: number }) => Promise<void>;
}

export const useProducerOpas = (): UseProducerOpasResult => {
  const [opas, setOpas] = useState<ActorWithSync[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOpas = useCallback(
    async (params: { producerId: string; page: number; limit: number }) => {
      setLoading(true);
      setError(null);

      try {
        const getProducerOpasUseCase = ActorServiceProvider.getProducerOpasUseCase();
        const result = await getProducerOpasUseCase.execute(
          params.producerId,
          params.page,
          params.limit
        );

        setOpas(result.actors);
        setPagination(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setOpas([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    opas,
    pagination,
    loading,
    error,
    loadOpas,
  };
};
