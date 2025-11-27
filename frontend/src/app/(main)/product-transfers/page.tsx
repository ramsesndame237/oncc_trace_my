"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { GroupageList } from "@/features/product-transfer/presentation/components/Groupage/GroupageList";
import { StandardList } from "@/features/product-transfer/presentation/components/Standard/StandardList";
import { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";

const ProductTransfersPage: React.FC = () => {
  const { t } = useTranslation(["productTransfer", "common"]);
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER
  const isActorManagerBET =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    ["BUYER", "EXPORTER", "TRANSFORMER"].includes(user?.actor?.actorType || "");

  const tabContent = useMemo(() => {
    const tabs = [
      {
        title: t("productTransfer:tabs.standard"),
        key: "standard",
        content: <StandardList />,
      },
    ];

    // ⭐ Masquer l'onglet groupage pour BUYER/EXPORTER/TRANSFORMER
    if (!isActorManagerBET) {
      tabs.push({
        title: t("productTransfer:tabs.groupage"),
        key: "groupage",
        content: <GroupageList />,
      });
    }

    return tabs;
  }, [t, isActorManagerBET]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loading")} />}>
      <AppContent
        title={t("productTransfer:page.title")}
        icon={<Icon name="TransfertIcon" />}
        tabContent={tabContent}
        defautValue="standard"
        listContent
      />
    </Suspense>
  );
};

export default ProductTransfersPage;
