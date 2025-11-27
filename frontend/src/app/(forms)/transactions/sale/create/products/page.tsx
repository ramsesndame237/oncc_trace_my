"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SaleAddStep2 } from "@/features/transaction/presentation/components/Sale/Add/SaleAddStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SaleAddProductsPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <SaleAddStep2 />
    </Suspense>
  );
}
