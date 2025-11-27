"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducersManageStep3 from "@/features/actor/presentation/components/Producers/ProducersManageStep3";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ManageSummaryPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersManageStep3 />
    </Suspense>
  );
}
