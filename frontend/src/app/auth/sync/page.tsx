"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { usePollingContext } from "@/core/infrastructure/providers/PollingProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface SyncProgress {
  completed: number;
  total: number;
  currentEntity: string;
}

export default function SyncPage() {
  const { t } = useTranslation("auth");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { startPolling, forceCheck } = usePollingContext();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    completed: 0,
    total: 0,
    currentEntity: "",
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const performSyncAndRedirect = useCallback(async (): Promise<void> => {
    try {
      // Récupérer le service de synchronisation via le Service Provider
      const syncService = ServiceProvider.Sync.getSyncService();

      // Mettre à jour le statut
      setSyncProgress({
        completed: 0,
        total: 1,
        currentEntity: t("sync.initializing"),
      });

      // Déclencher la synchronisation post-login
      await syncService.forcePostLoginSync();

      // Démarrer le polling après la synchronisation initiale
      console.log("🚀 Démarrage du polling après synchronisation initiale");
      startPolling();

      // Forcer une vérification immédiate
      await forceCheck();

      setIsCompleted(true);

      // Attendre 1.5 secondes pour montrer le succès, puis rediriger
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);
    } catch (syncError) {
      console.error("❌ Erreur lors de la synchronisation:", syncError);
      setError(t("sync.syncErrorMessage"));

      // Rediriger vers le dashboard après 3 secondes même en cas d'erreur
      setTimeout(() => {
        router.replace("/dashboard");
      }, 3000);
    }
  }, [router, startPolling, forceCheck, t]);

  useEffect(() => {
    // Rediriger vers la page de connexion si pas de session
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Lancer la synchronisation
    performSyncAndRedirect();
  }, [session, status, router, performSyncAndRedirect]);

  if (status === "loading") {
    return <LoadingFallback message={t("sync.verifyingSession")} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-4">
        <div className="w-full text-center p-6">
          <div className="mb-4 text-center">
            <LoadingLoader />
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">
            {t("sync.syncError")}
          </h1>
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-primary">
            {t("sync.redirectingToDashboard")}
          </p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-4">
        <div className="w-full text-center p-6">
          <div className="mb-4 text-center">
            <LoadingLoader />
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">
            {t("sync.syncCompleted")}
          </h1>
          <p className="text-primary mb-4">
            {t("sync.syncCompletedMessage")}
          </p>
          <p className="text-sm text-primary">
            {t("sync.redirectingDashboard")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full text-center p-6">
        <div className="mb-6 text-center">
          <div className="mb-4 text-center">
            <LoadingLoader />
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">
            {t("sync.syncInProgress")}
          </h1>
          <p className="text-primary">
            {t("sync.preparingData")}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-primary">
            {syncProgress.currentEntity || t("sync.syncing")}
          </p>
        </div>

        <div className="text-xs text-primary">
          {t("sync.pleaseWait")}
        </div>
      </div>
    </div>
  );
}
