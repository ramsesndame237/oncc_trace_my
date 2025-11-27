"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducerAddStep2 from "@/features/actor/presentation/components/Producer/ProducerAddStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerAddParcelsPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <ProducerAddStep2 />
    </Suspense>
  );
}
