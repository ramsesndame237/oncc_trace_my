"use client";

import ProducerEditParcels from "@/features/actor/presentation/components/Producer/ProducerEditParcels";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditParcelsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ProducerEditParcels />
    </Suspense>
  );
}
