"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { ProducersList } from "@/features/actor/presentation/components/Producers/ProducersList";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const OPAPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <AppContent
        title={t("producers.title")}
        icon={<Icon name="OpaIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-opa" size="icon">
            <Link href="/actors/producers/choice">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ProducersList />
      </AppContent>
    </Suspense>
  );
};

export default OPAPage;
