"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import BuyersManageStep2 from "@/features/actor/presentation/components/Exporters/BuyersManageStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyersManageSelectBuyersPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <BuyersManageStep2 />
    </Suspense>
  );
}
