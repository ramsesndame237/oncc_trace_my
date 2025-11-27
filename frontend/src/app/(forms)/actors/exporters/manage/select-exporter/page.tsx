"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import BuyersManageStep1 from "@/features/actor/presentation/components/Exporters/BuyersManageStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyersManageSelectExporterPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <BuyersManageStep1 />
    </Suspense>
  );
}
