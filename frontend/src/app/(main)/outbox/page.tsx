"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { OutboxList } from "@/features/outbox";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

/**
 * Page complète de gestion des opérations outbox
 *
 * Fonctionnalités incluses:
 * - Visualisation des opérations en attente et échouées
 * - Filtrage avancé (type d'entité, opération, statut, recherche textuelle)
 * - Sélection multiple et actions en lot (suppression, retry)
 * - Synchronisation forcée avec le serveur
 * - Pagination avec URL state management
 * - Widget de statut de synchronisation en temps réel
 * - Interface responsive (desktop/mobile)
 * - Gestion des erreurs avec retry automatique
 */
export default function OutboxPage() {
  const { t } = useTranslation(["outbox", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <AppContent
        title={t("page.title")}
        icon={<Icon name="Send" />}
        listContent
        className="space-y-0"
      >
        {/* Composant principal OutboxList avec toutes les fonctionnalités */}
        <OutboxList
          showToolbar={true}
          showSyncStatus={true}
          compactMode={false}
          className="bg-white"
        />
      </AppContent>
    </Suspense>
  );
}
