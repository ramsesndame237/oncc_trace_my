"use client";

import { usePolling } from "@/core/infrastructure/hooks/usePolling";
import { PinSessionService } from "@/features/pin/infrastructure/services/pinSessionService";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useRef } from "react";

interface PollingContextType {
  startPolling: () => void;
  stopPolling: () => void;
  adjustPollingFrequency: (state: "active" | "background" | "offline") => void;
  forceCheck: () => Promise<void>;
  getPollingStatus: () => {
    isActive: boolean;
    lastSyncTime: number;
    timeSinceLastSync: number;
  };
  isPollingActive: boolean;
}

const PollingContext = createContext<PollingContextType | null>(null);

export function usePollingContext() {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error("usePollingContext doit être utilisé dans un PollingProvider");
  }
  return context;
}

interface PollingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider global pour gérer le polling de synchronisation
 * Gère automatiquement l'arrêt du polling lors de la déconnexion ou de l'expiration de session PIN
 */
export function PollingProvider({ children }: PollingProviderProps) {
  const { data: session, status } = useSession();
  const polling = usePolling();
  const pinCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastPinCheck = useRef<boolean>(true);

  // Surveiller l'état de la session PIN
  useEffect(() => {
    if (!session?.user || status !== "authenticated") {
      // Pas de session active, arrêter le polling et la surveillance PIN
      if (pinCheckInterval.current) {
        clearInterval(pinCheckInterval.current);
        pinCheckInterval.current = null;
      }
      return;
    }

    const userId = String(session.user.id);

    // Fonction pour vérifier l'état de la session PIN
    const checkPinSession = () => {
      const isPinAuthenticated = PinSessionService.isUserAuthenticated(userId);
      
      // Si la session PIN vient d'expirer, arrêter le polling
      if (lastPinCheck.current && !isPinAuthenticated) {
        console.log("🛑 Session PIN expirée, arrêt du polling");
        polling.stopPolling();
      }
      
      lastPinCheck.current = isPinAuthenticated;
    };

    // Vérifier immédiatement
    checkPinSession();

    // Vérifier toutes les 30 secondes si la session PIN est toujours valide
    pinCheckInterval.current = setInterval(checkPinSession, 30000);

    return () => {
      if (pinCheckInterval.current) {
        clearInterval(pinCheckInterval.current);
        pinCheckInterval.current = null;
      }
    };
  }, [session?.user, status, polling]);

  // Surveiller les changements de session NextAuth
  useEffect(() => {
    // Si la session NextAuth disparaît, arrêter immédiatement le polling
    if (status !== "loading" && !session?.user) {
      console.log("🛑 Session NextAuth expirée, arrêt du polling");
      polling.stopPolling();
      
      // Nettoyer aussi la session PIN
      PinSessionService.clearSession();
    }
  }, [session?.user, status, polling]);

  // Écouter les événements de déconnexion
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Arrêter le polling avant la fermeture/rafraîchissement de la page
      polling.stopPolling();
    };

    const handleStorageChange = (event: StorageEvent) => {
      // Si la session PIN est effacée dans un autre onglet
      if (event.key === "pin_session" && !event.newValue) {
        console.log("🛑 Session PIN effacée dans un autre onglet, arrêt du polling");
        polling.stopPolling();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [polling]);

  const contextValue: PollingContextType = {
    startPolling: polling.startPolling,
    stopPolling: polling.stopPolling,
    adjustPollingFrequency: polling.adjustPollingFrequency,
    forceCheck: polling.forceCheck,
    getPollingStatus: polling.getPollingStatus,
    isPollingActive: polling.isPollingActive,
  };

  return (
    <PollingContext.Provider value={contextValue}>
      {children}
    </PollingContext.Provider>
  );
}