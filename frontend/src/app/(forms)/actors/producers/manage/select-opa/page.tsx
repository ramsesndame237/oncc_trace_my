"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import ProducersManageStep1 from "@/features/actor/presentation/components/Producers/ProducersManageStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SelectOPAPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersManageStep1 />
    </Suspense>
  );
}
