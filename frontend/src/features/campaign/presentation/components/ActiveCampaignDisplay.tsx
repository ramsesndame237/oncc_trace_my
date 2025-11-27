"use client";

import { useActiveCampaign } from "../hooks/useActiveCampaign";

/**
 * Composant d'exemple pour afficher la campagne active
 * Peut être utilisé dans l'en-tête de l'application ou dans le tableau de bord
 */
export function ActiveCampaignDisplay() {
  const { activeCampaign, isLoading, error } = useActiveCampaign();

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Chargement de la campagne active...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">Erreur: {error}</div>;
  }

  if (!activeCampaign) {
    return <div className="text-sm text-gray-500">Aucune campagne active</div>;
  }

  return (
    <div className="text-sm">
      <span className="text-gray-600">Campagne active:</span>{" "}
      <span className="font-semibold text-primary">{activeCampaign.code}</span>
    </div>
  );
}
