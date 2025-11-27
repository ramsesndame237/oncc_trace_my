"use client";

import { apiClient } from "@/core/infrastructure/api/client";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

/**
 * Hook qui détermine si l'API client est prêt à effectuer des requêtes authentifiées
 * Retourne true seulement si la session est authentifiée ET que l'API client est initialisé
 */
export function useApiReady(): boolean {
  const { status } = useSession();

  return useMemo(() => {
    return status === "authenticated" && apiClient.getIsInitialized();
  }, [status]);
}
