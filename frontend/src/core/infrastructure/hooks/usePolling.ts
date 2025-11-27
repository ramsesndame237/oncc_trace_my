"use client";

import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useCallback, useEffect, useRef } from "react";

/**
 * Hook pour gérer le polling de synchronisation global
 * Active le polling durant la vie de l'application et l'arrête lors de la déconnexion
 */
export function usePolling() {
  const { user } = useAuthStore();
  const pollingStarted = useRef(false);

  const startPolling = useCallback(() => {
    if (pollingStarted.current) {
      return;
    }

    try {
      const pollingService = ServiceProvider.Sync.getPollingService();
      pollingService.start();
      pollingStarted.current = true;
      console.log("🚀 Polling démarré via usePolling");
    } catch (error) {
      console.error("❌ Erreur lors du démarrage du polling:", error);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (!pollingStarted.current) {
      return;
    }

    try {
      const pollingService = ServiceProvider.Sync.getPollingService();
      pollingService.stop();
      pollingStarted.current = false;
      console.log("🛑 Polling arrêté via usePolling");
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt du polling:", error);
    }
  }, []);

  const adjustPollingFrequency = useCallback(
    (state: "active" | "background" | "offline") => {
      if (!pollingStarted.current) {
        return;
      }

      try {
        const pollingService = ServiceProvider.Sync.getPollingService();
        pollingService.adjustFrequency(state);
      } catch (error) {
        console.error("❌ Erreur lors de l'ajustement du polling:", error);
      }
    },
    []
  );

  const forceCheck = useCallback(async () => {
    if (!pollingStarted.current) {
      return;
    }

    try {
      const pollingService = ServiceProvider.Sync.getPollingService();
      await pollingService.forceCheck();
    } catch (error) {
      console.error("❌ Erreur lors de la vérification forcée:", error);
    }
  }, []);

  const getPollingStatus = useCallback(() => {
    try {
      const pollingService = ServiceProvider.Sync.getPollingService();
      return pollingService.getStatus();
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du statut du polling:",
        error
      );
      return {
        isActive: false,
        lastSyncTime: 0,
        timeSinceLastSync: 0,
      };
    }
  }, []);

  // Gérer le polling basé sur l'état de l'authentification
  useEffect(() => {
    // Si utilisateur connecté, démarrer le polling
    if (user) {
      startPolling();
    } else {
      // Si pas d'utilisateur, arrêter le polling
      stopPolling();
    }

    // Cleanup au démontage du composant
    return () => {
      // Note: On ne stoppe pas automatiquement ici car le hook peut être utilisé
      // dans plusieurs composants. Le polling sera stoppé quand la session se termine.
    };
  }, [user, startPolling, stopPolling]);

  // Gérer les changements de visibilité de la page
  useEffect(() => {
    if (!user) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        adjustPollingFrequency("background");
      } else {
        adjustPollingFrequency("active");
      }
    };

    const handleOnline = async () => {
      console.log(
        "🌐 [usePolling] Connexion rétablie, déclenchement de la synchronisation..."
      );
      adjustPollingFrequency("active");

      // ✅ Déclencher immédiatement la synchronisation des pendingOperations
      try {
        const syncService = ServiceProvider.Sync.getSyncService();
        await syncService.processQueue();
        console.log(
          "✅ [usePolling] Synchronisation automatique réussie"
        );
      } catch (error) {
        console.error(
          "❌ [usePolling] Erreur lors de la synchronisation automatique:",
          error
        );
      }

      // Forcer également une vérification des mises à jour serveur
      await forceCheck();
    };

    const handleOffline = () => {
      console.log("📴 [usePolling] Connexion perdue");
      adjustPollingFrequency("offline");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, adjustPollingFrequency, forceCheck]);

  return {
    startPolling,
    stopPolling,
    adjustPollingFrequency,
    forceCheck,
    getPollingStatus,
    isPollingActive: pollingStarted.current,
  };
}
