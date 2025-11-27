"use client";

import { db, PendingOperation } from "@/core/infrastructure/database/db";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook principal pour la gestion des opérations outbox
 * Fournit les fonctionnalités de récupération des données, refresh, et gestion d'état
 */
export function useOutbox() {
  const [operations, setOperations] = useState<PendingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchOperations = useCallback(async () => {
    try {
      setError(null);
      
      // 🔒 SÉCURITÉ CRITIQUE: Vérifier qu'un utilisateur est connecté
      if (!user?.id) {
        // Pas d'utilisateur connecté, aucune opération à afficher
        setOperations([]);
        return;
      }

      // Récupérer uniquement les opérations de campagne de l'utilisateur connecté
      const campaignOperations = await db.pendingOperations
        .where("entityType")
        .equals("campaign")
        .filter(op => op.userId === user.id) // Filtrage par utilisateur
        .reverse() // Les plus récentes en premier
        .sortBy("timestamp");

      setOperations(campaignOperations);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Erreur lors du chargement des opérations outbox";
      console.error("Erreur lors du chargement des opérations outbox:", err);
      setError(errorMessage);
      setOperations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOperations();
    
    // Auto-refresh toutes les 3 secondes pour garder les données à jour
    const interval = setInterval(fetchOperations, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchOperations]); // Refetch when user changes (login/logout/switching)

  const refresh = () => {
    setIsLoading(true);
    fetchOperations();
  };

  const getOperationById = (operationId: string | number) => {
    return operations.find(op => op.id?.toString() === operationId.toString());
  };

  const getOperationsByEntityId = (entityId: string) => {
    return operations.filter(op => op.entityId === entityId);
  };

  const getOperationsByType = (operationType: "create" | "update" | "delete") => {
    return operations.filter(op => op.operation === operationType);
  };

  const getFailedOperations = () => {
    return operations.filter(op => op.lastError);
  };

  const getOperationsWithRetries = (minRetries: number = 1) => {
    return operations.filter(op => op.retries >= minRetries);
  };

  return {
    // Données principales
    operations,
    isLoading,
    error,
    
    // Actions
    refresh,
    
    // Utilitaires de filtrage
    getOperationById,
    getOperationsByEntityId,
    getOperationsByType,
    getFailedOperations,
    getOperationsWithRetries,
    
    // Statistiques
    totalOperations: operations.length,
    failedOperations: operations.filter(op => op.lastError).length,
    successfulOperations: operations.filter(op => !op.lastError).length,
  };
}