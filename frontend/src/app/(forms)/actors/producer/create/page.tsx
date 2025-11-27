"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerEditStep1 from "@/features/actor/presentation/components/Producer/ProducerEditStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProducerEditStep1 />
    </Suspense>
  );
}
