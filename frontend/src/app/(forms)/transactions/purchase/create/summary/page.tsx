"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseAddStep4 } from "@/features/transaction/presentation/components/Purchase/Add/PurchaseAddStep4";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function PurchaseAddSummaryPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <PurchaseAddStep4 />
    </Suspense>
  );
}
