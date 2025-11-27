import { useEffect, useState } from "react";

/**
 * Hook pour détecter le statut de connexion en ligne/hors ligne
 * @returns true si en ligne, false si hors ligne
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== "undefined" ? window.navigator.onLine : true
  );

  useEffect(() => {
    // Vérifier si on est côté client
    if (typeof window === "undefined") {
      return;
    }

    // Handler pour le passage en ligne
    const handleOnline = () => {
      console.log("🌐 Connexion rétablie");
      setIsOnline(true);
    };

    // Handler pour le passage hors ligne
    const handleOffline = () => {
      console.log("📡 Connexion perdue");
      setIsOnline(false);
    };

    // Écouter les événements de changement de connexion
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Nettoyer les listeners lors du démontage
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
