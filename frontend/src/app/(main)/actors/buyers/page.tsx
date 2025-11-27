"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { BuyersList } from "@/features/actor/presentation/components/Buyers/BuyersList";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const BuyersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <AppContent
        title={t("buyer.title")}
        icon={<Icon name="BuyerIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-buyer" size="icon">
            <Link href="/actors/buyers/create">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <BuyersList />
      </AppContent>
    </Suspense>
  );
};

export default BuyersPage;
