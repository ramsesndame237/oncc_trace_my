"use client";

import { SyncServiceProvider } from "@/core/infrastructure/di/syncServiceProvider";
import { sessionService } from "@/core/infrastructure/services/sessionService";
import { usePinAuthStore } from "@/features/pin/infrastructure/store/pinAuthStore";
import { useSession } from "next-auth/react";
import { useEffect, useRef, type ReactNode } from "react";

interface SessionSyncProviderProps {
  children: ReactNode;
}

/**
 * Provider qui synchronise automatiquement la session NextAuth avec l'API client
 * et déclenche la synchronisation post-connexion via SyncService
 * Doit être placé à un niveau élevé dans l'arbre des composants, idéalement dans le layout principal
 */
export function SessionSyncProvider({ children }: SessionSyncProviderProps) {
  const { data: session, status } = useSession();
  const hasTriggeredPostLoginSync = useRef(false);

  // ⭐ Écouter l'état d'authentification PIN
  const isPinAuthenticated = usePinAuthStore((state) => state.authState);

  // Initialiser le service de session au montage du composant
  useEffect(() => {
    sessionService.initialize().catch((error) => {
      console.error(
        "Erreur lors de l'initialisation du service de session:",
        error
      );
    });
  }, []);

  // Synchroniser les changements de session avec l'API client
  useEffect(() => {
    if (status !== "loading") {
      sessionService.handleSessionUpdate(session);
    }
  }, [session, status]);

  // Déclencher la synchronisation post-connexion UNIQUEMENT quand le PIN est authentifié
  useEffect(() => {
    const triggerPostLoginSync = async () => {
      // ⭐ Ne rien faire si le PIN n'est pas authentifié
      if (!isPinAuthenticated) {
        console.log("⏸️ En attente de l'authentification PIN...");
        return;
      }

      if (
        status === "authenticated" &&
        session?.user &&
        !hasTriggeredPostLoginSync.current
      ) {
        try {
          hasTriggeredPostLoginSync.current = true;

          console.log(
            "🔄 Déclenchement de la synchronisation post-connexion (PIN vérifié)..."
          );

          // ⭐ ÉTAPE 1 : Vérifier les mises à jour via le polling AVANT de synchroniser
          // Cela garantit que les delta counts sont à jour
          console.log("📡 Vérification des mises à jour via polling...");
          const pollingService = SyncServiceProvider.getPollingService();
          await pollingService.forceCheck();
          console.log("✅ Vérification polling terminée, delta counts mis à jour");

          // ⭐ ÉTAPE 2 : Synchroniser avec les delta counts corrects
          const syncService = SyncServiceProvider.getSyncService();
          await syncService.forcePostLoginSync();

          console.log("✅ Synchronisation post-connexion terminée");
        } catch (error) {
          console.error(
            "❌ Erreur lors de la synchronisation post-connexion:",
            error
          );
        }
      }
    };

    triggerPostLoginSync().catch(console.error);
  }, [session, status, isPinAuthenticated]); // ⭐ Ajouter isPinAuthenticated aux dépendances

  // Réinitialiser le flag quand l'utilisateur se déconnecte
  useEffect(() => {
    if (status === "unauthenticated") {
      hasTriggeredPostLoginSync.current = false;
    }
  }, [status]);

  return <>{children}</>;
}
