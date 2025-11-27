"use client";

import { useCallback, useEffect, useState } from "react";
import { useCampaignStore } from "../../infrastructure/store/campaignStore";
import { CampaignResponse } from "../../domain/types";

/**
 * Hook pour récupérer une campagne spécifique par son ID
 * Utilise le store centralisé pour la cohérence avec le pattern de référence
 */
export function useGetCampaignById(id: string) {
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchCampaignById } = useCampaignStore();

  const fetchCampaign = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID campagne invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedCampaign = await fetchCampaignById(id);
      setCampaign(fetchedCampaign);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la campagne"
      );
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchCampaignById]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return {
    campaign,
    isLoading,
    error,
    refetch: fetchCampaign,
  };
}
