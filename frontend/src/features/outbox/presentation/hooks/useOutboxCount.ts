"use client";

import { db } from "@/core/infrastructure/database/db";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook pour compter le nombre d'opérations en attente dans la file outbox locale
 * Version améliorée avec gestion d'erreurs, optimisations, et sécurité utilisateur
 * Compte toutes les entités (utilisateurs, campagnes, etc.) en attente de synchronisation
 * @returns object avec count, isLoading, error et refresh
 */
export function useOutboxCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const updateCount = useCallback(async () => {
    try {
      setError(null);
      
      // 🔒 SÉCURITÉ CRITIQUE: Vérifier qu'un utilisateur est connecté
      if (!user?.id) {
        // Pas d'utilisateur connecté, aucune opération à compter
        setCount(0);
        return;
      }

      // Compter toutes les opérations en attente de l'utilisateur connecté (toutes entités)
      const totalCount = await db.pendingOperations
        .filter(op => op.userId === user.id) // Filtrage par utilisateur uniquement
        .count();
      
      setCount(totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur lors du comptage des opérations outbox:', err);
      setError(errorMessage);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Mettre à jour le compteur immédiatement
    updateCount();

    // Configurer un intervalle pour mettre à jour le compteur en temps réel
    const interval = setInterval(updateCount, 2000); // Vérifier toutes les 2 secondes

    return () => {
      clearInterval(interval);
    };
  }, [updateCount]); // Recount when user changes (login/logout/switching)

  const refresh = () => {
    setIsLoading(true);
    updateCount();
  };

  return {
    count,
    isLoading,
    error,
    refresh
  };
}