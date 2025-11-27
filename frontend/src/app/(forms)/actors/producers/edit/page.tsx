"use client";

import ProducersEdit from "@/features/actor/presentation/components/Producers/ProducersEdit";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducersEditPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ProducersEdit />
    </Suspense>
  );
}
