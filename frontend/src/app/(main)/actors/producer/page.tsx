"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { ProducerList } from "@/features/actor/presentation/components/Producer/ProducerList";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProducersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <AppContent
        title={t("producer.title")}
        icon={<Icon name="ProducerIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-producer" size="icon">
            <Link href="/actors/producer/choice">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ProducerList />
      </AppContent>
    </Suspense>
  );
};

export default ProducersPage;
