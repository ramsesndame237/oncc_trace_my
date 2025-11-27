"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ProducerViewContent } from "@/features/actor/presentation/components/Producer/ProducerViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProducerViewPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProducerViewContent />
    </Suspense>
  );
};

export default ProducerViewPage;