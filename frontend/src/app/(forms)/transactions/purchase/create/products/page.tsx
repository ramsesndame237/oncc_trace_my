"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseAddStep2 } from "@/features/transaction/presentation/components/Purchase/Add/PurchaseAddStep2";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function PurchaseAddProductsPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <PurchaseAddStep2 />
    </Suspense>
  );
}
