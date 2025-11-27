"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ProducersViewContent } from "@/features/actor/presentation/components/Producers/ProducersViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProducersViewPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersViewContent />
    </Suspense>
  );
};

export default ProducersViewPage;
