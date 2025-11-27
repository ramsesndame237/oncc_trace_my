"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import BuyersManageStep3 from "@/features/actor/presentation/components/Exporters/BuyersManageStep3";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyersManageConfirmationPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <BuyersManageStep3 />
    </Suspense>
  );
}
