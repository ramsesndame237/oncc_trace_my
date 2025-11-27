import type { ActiveCampaignData } from "@/core/infrastructure/database/db";
import { SettingsService } from "@/core/infrastructure/services/settingsService";
import { useEffect, useState } from "react";

/**
 * Hook pour accéder à la campagne active stockée localement
 */
export function useActiveCampaign() {
  const [activeCampaign, setActiveCampaign] =
    useState<ActiveCampaignData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActiveCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const campaign = await SettingsService.getActiveCampaign();
      setActiveCampaign(campaign);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la campagne active"
      );
      setActiveCampaign(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveCampaign().catch(console.error);
  }, []);

  return {
    activeCampaign,
    isLoading,
    error,
    refetch: loadActiveCampaign,
  };
}
