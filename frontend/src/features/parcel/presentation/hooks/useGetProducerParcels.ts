"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { container } from "tsyringe";
import { GetProducerParcelsUseCase } from "../../application/useCases/getProducerParcelsUseCase";
import type {
  ApiParcelResponse,
  GetProducerParcelsFilters,
} from "../../domain/parcel.types";

interface UseGetProducerParcelsResult {
  parcels: ApiParcelResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useGetProducerParcels = (
  filters: GetProducerParcelsFilters,
  enabled: boolean = true,
  isOnline: boolean = true
): UseGetProducerParcelsResult => {
  const [parcels, setParcels] = useState<ApiParcelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utiliser un ref pour tracker si les parcelles ont déjà été chargées
  const hasFetchedRef = useRef(false);
  const lastActorIdRef = useRef<string | null>(null);

  const fetchParcels = useCallback(async () => {
    if (!enabled || !filters.actorId) {
      return;
    }

    // Si l'actorId a changé, réinitialiser le flag
    if (lastActorIdRef.current !== filters.actorId) {
      hasFetchedRef.current = false;
      lastActorIdRef.current = filters.actorId;
    }

    // Ne charger qu'une seule fois par actorId
    if (hasFetchedRef.current) {
      return;
    }

    try {
      hasFetchedRef.current = true;
      setIsLoading(true);
      setError(null);

      const getProducerParcelsUseCase = container.resolve(
        GetProducerParcelsUseCase
      );
      const apiParcels = await getProducerParcelsUseCase.execute(
        filters,
        isOnline
      );

      // Utiliser directement les données API
      setParcels(apiParcels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Erreur lors de la récupération des parcelles:", err);
      // En cas d'erreur, réinitialiser le flag pour permettre une nouvelle tentative
      hasFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [filters, enabled, isOnline]);

  // Fonction de refetch qui force le rechargement
  const refetch = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchParcels();
  }, [fetchParcels]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  return {
    parcels,
    isLoading,
    error,
    refetch,
  };
};
