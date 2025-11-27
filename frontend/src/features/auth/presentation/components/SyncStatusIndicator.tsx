"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  container,
  ensureDIConfigured,
} from "@/core/infrastructure/di/container";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { SyncService } from "@/core/infrastructure/services/syncService";
import { Cloud, CloudOff, RotateCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

interface SyncStatusData {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

/**
 * Composant d'indicateur de statut de synchronisation
 * Affiche l'état de la connexion et le nombre d'opérations en attente pour l'utilisateur connecté
 */
export function SyncStatusIndicator() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatusData>({
    isOnline: typeof window !== "undefined" ? navigator.onLine : false,
    pendingCount: 0,
    isSyncing: false,
  });

  // Mettre à jour le statut périodiquement
  useEffect(() => {
    let syncService: SyncService | null = null;

    try {
      // S'assurer que le conteneur DI est configuré
      ensureDIConfigured();
      syncService = container.resolve<SyncService>(DI_TOKENS.SyncService);
    } catch (error) {
      console.error("Erreur lors de la résolution du SyncService:", error);
      return;
    }

    const updateStatus = async () => {
      if (!syncService || !user?.id) return;

      try {
        const pendingCount = await syncService.getPendingOperationsCountForUser(
          user.id
        );

        setStatus((prevStatus) => ({
          ...prevStatus,
          pendingCount,
          isOnline: typeof window !== "undefined" ? navigator.onLine : false,
        }));
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour du statut de sync:",
          error
        );
      }
    };

    // Mise à jour initiale
    updateStatus();

    // Mise à jour périodique
    const interval = setInterval(updateStatus, 5000);

    // Écouter les changements de connexion
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      updateStatus();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [user?.id]);

  const handleForceSync = async () => {
    if (!user?.id) return;

    try {
      ensureDIConfigured();
      const syncService = container.resolve<SyncService>(DI_TOKENS.SyncService);
      setStatus((prev) => ({ ...prev, isSyncing: true }));

      await syncService.processQueueForUser(user.id);

      // Attendre un peu pour l'animation puis mettre à jour
      setTimeout(() => {
        setStatus((prev) => ({ ...prev, isSyncing: false }));
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      setStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  // Ne pas afficher si l'utilisateur n'est pas connecté
  if (!user) {
    return null;
  }

  const getStatusIcon = () => {
    if (status.isSyncing) {
      return <RotateCw className="h-4 w-4 animate-spin" />;
    }

    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }

    return status.pendingCount > 0 ? (
      <CloudOff className="h-4 w-4" />
    ) : (
      <Cloud className="h-4 w-4" />
    );
  };

  const getStatusVariant = () => {
    if (status.isSyncing) {
      return "pending" as const;
    }

    if (!status.isOnline) {
      return "warning" as const;
    }

    return status.pendingCount > 0
      ? ("warning" as const)
      : ("success" as const);
  };

  const getStatusText = () => {
    if (status.isSyncing) {
      return t("sync.syncing");
    }

    if (!status.isOnline) {
      return t("sync.offline");
    }

    if (status.pendingCount > 0) {
      return t("sync.pending", { count: status.pendingCount });
    }

    return t("sync.synced");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Statut de synchronisation */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 py-1 gap-2"
        onClick={handleForceSync}
        disabled={status.isSyncing || !status.isOnline}
        title={
          status.isOnline ? t("sync.clickToSync") : t("sync.unavailableOffline")
        }
      >
        {getStatusIcon()}
        <Badge variant={getStatusVariant()} className="text-xs">
          {getStatusText()}
        </Badge>
      </Button>
    </div>
  );
}
