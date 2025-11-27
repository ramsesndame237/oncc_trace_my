"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { SaleList } from "@/features/transaction/presentation/components/Sale/SaleList";
import { PurchaseList } from "@/features/transaction/presentation/components/Purchase/PurchaseList";

export default function TransactionsPage() {
  const { t } = useTranslation(["transaction", "common"]);
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type PRODUCERS
  const isActorManagerProducers =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    user?.actor?.actorType === "PRODUCERS";

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type TRANSFORMER
  const isActorManagerTransformer =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    user?.actor?.actorType === "TRANSFORMER";

  const tabContent = useMemo(() => {
    const tabs: Array<{ title: string; key: string; content: React.ReactNode }> = [];

    // ⭐ N'ajouter le tab sales que si l'utilisateur n'est pas actor_manager TRANSFORMER
    if (!isActorManagerTransformer) {
      tabs.push({
        title: t("transaction:tabs.sales"),
        key: "sales",
        content: <SaleList />,
      });
    }

    // ⭐ N'ajouter le tab purchases que si l'utilisateur n'est pas actor_manager PRODUCERS
    if (!isActorManagerProducers) {
      tabs.push({
        title: t("transaction:tabs.purchases"),
        key: "purchases",
        content: <PurchaseList />,
      });
    }

    return tabs;
  }, [t, isActorManagerProducers, isActorManagerTransformer]);

  return (
    <AppContent
      title={t("transaction:page.title")}
      icon={<Icon name="TransactionIcon" />}
      tabContent={tabContent}
      defautValue={isActorManagerTransformer ? "purchases" : "sales"}
      listContent
    />
  );
}
