"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ExporterViewContent } from "@/features/actor/presentation/components/Exporters/ExporterViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ExportersViewPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ExporterViewContent />
    </Suspense>
  );
};

export default ExportersViewPage;
