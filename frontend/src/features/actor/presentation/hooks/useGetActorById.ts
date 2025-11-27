"use client";

import { Actor } from "@/core/domain/actor.types";
import { useCallback, useEffect, useState } from "react";
import { useActorStore } from "../../infrastructure/store/actorStore";

/**
 * Hook pour récupérer un acteur spécifique par son ID
 * Utilise le store centralisé pour la cohérence avec le pattern de référence
 */
export function useGetActorById(id: string) {
  const [actor, setActor] = useState<Actor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchActorById } = useActorStore();

  const fetchActor = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID acteur invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedActor = await fetchActorById(id);
      setActor(fetchedActor);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de l'acteur"
      );
      setActor(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchActorById]);

  useEffect(() => {
    fetchActor();
  }, [fetchActor]);

  return {
    actor,
    isLoading,
    error,
    refetch: fetchActor,
  };
}