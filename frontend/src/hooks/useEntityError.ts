import { db } from "@/core/infrastructure/database/db";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useCallback, useEffect, useState } from "react";

interface EntityError {
  code: string;
  message: string;
  timestamp: number;
  conflicts?: Array<{
    locationCode: string;
    locationName: string;
    basinId: string;
    basinName: string;
  }>;
  regionConflicts?: Array<{
    parentLocationCode: string;
    parentLocationName: string;
    parentType: string;
    conflictingChildren: Array<{
      locationCode: string;
      locationName: string;
      basinId: string;
      basinName: string;
    }>;
  }>;
  departmentConflicts?: Array<{
    parentLocationCode: string;
    parentLocationName: string;
    parentType: string;
    conflictingChildren: Array<{
      locationCode: string;
      locationName: string;
      basinId: string;
      basinName: string;
    }>;
  }>;
  parcelErrors?: Array<{
    index: number;
    parcelNumber: number;
    field: string;
    value: string;
    message: string;
  }>;
}

/**
 * Hook pour récupérer les erreurs de synchronisation d'une entité spécifique
 * Réutilisable pour toutes les entités (user, campaign, productionBasin, store, etc.)
 */
export function useEntityError(entityId: string, entityType: string) {
  const [error, setError] = useState<EntityError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchError = useCallback(async () => {
    if (!user?.id || !entityId) {
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      const pendingOperation = await db.pendingOperations
        .where("entityId")
        .equals(entityId)
        .and((op) => op.userId === user.id && op.entityType === entityType)
        .first();

      setError(pendingOperation?.lastError || null);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'erreur:", err);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, user?.id]);

  useEffect(() => {
    fetchError();
  }, [fetchError]);

  return {
    error,
    isLoading,
    refetch: fetchError,
    hasError: !!error,
  };
}
