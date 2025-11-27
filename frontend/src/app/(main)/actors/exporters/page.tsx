"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { ExportersList } from "@/features/actor/presentation/components/Exporters/ExportersList";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ExportersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <AppContent
        title={t("exporter.title")}
        icon={<Icon name="ExporterIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-exporter" size="icon">
            <Link href="/actors/exporters/choice">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ExportersList />
      </AppContent>
    </Suspense>
  );
};

export default ExportersPage;
