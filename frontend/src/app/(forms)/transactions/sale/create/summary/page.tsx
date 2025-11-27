"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SaleAddStep4 } from "@/features/transaction/presentation/components/Sale/Add/SaleAddStep4";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SaleAddSummaryPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <SaleAddStep4 />
    </Suspense>
  );
}
