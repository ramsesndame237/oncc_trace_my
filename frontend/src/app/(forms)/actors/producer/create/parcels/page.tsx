"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerEditStep2 from "@/features/actor/presentation/components/Producer/ProducerEditStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditParcelsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProducerEditStep2 />
    </Suspense>
  );
}