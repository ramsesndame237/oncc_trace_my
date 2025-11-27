"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducersManageStep2 from "@/features/actor/presentation/components/Producers/ProducersManageStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ManageProducersPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersManageStep2 />
    </Suspense>
  );
}
