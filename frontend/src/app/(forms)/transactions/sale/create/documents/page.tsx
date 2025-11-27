"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SaleAddStep3 } from "@/features/transaction/presentation/components/Sale/Add/SaleAddStep3";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SaleAddDocumentsPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <SaleAddStep3 />
    </Suspense>
  );
}
