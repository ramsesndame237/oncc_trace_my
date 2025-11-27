"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerEditStep3 from "@/features/actor/presentation/components/Producer/ProducerEditStep3";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProducerEditStep3 />
    </Suspense>
  );
}