"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerAddStep1 from "@/features/actor/presentation/components/Producer/ProducerAddStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function AddExistingProducerPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducerAddStep1 />
    </Suspense>
  );
}
