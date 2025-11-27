"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { StoreList } from "@/features/store/presentation/components/StoreList";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Page de liste des magasins
 */
const StoresPageContent: React.FC = () => {
  const { t } = useTranslation("store");
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager
  const isActorManager = user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER;

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut pas créer de stores)
  const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;

  // ⭐ L'utilisateur peut créer des stores
  const canCreateStore = !isFieldAgent && !isActorManager;

  return (
    <AppContent
      title={t("page.title")}
      icon={<Icon name="CustomWareHouse" />}
      listContent
      topActionButton={
        canCreateStore
          ? [
              <Button variant="ghost" key="add-store" size="icon">
                <Link href="/stores/edit">
                  <Icon name="PlusIcon" />
                </Link>
              </Button>,
            ]
          : []
      }
    >
      <StoreList />
    </AppContent>
  );
};

const StoresPage: React.FC = () => {
  const { t } = useTranslation("store");

  return (
    <Suspense fallback={<LoadingFallback message={t("page.loading")} />}>
      <StoresPageContent />
    </Suspense>
  );
};

export default StoresPage;