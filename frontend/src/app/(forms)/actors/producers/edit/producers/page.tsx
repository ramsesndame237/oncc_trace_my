"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducersManage from "@/features/actor/presentation/components/Producers/ProducersManage";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducersManagePage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersManage />
    </Suspense>
  );
}
