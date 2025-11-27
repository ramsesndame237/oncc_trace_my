"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import BuyersManage from "@/features/actor/presentation/components/Exporters/BuyersManage";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyersManagePage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <BuyersManage />
    </Suspense>
  );
}
