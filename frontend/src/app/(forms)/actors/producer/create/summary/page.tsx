"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerEditStep4 from "@/features/actor/presentation/components/Producer/ProducerEditStep4";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditSummaryPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProducerEditStep4 />
    </Suspense>
  );
}