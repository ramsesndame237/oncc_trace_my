"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseAddStep3 } from "@/features/transaction/presentation/components/Purchase/Add/PurchaseAddStep3";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function PurchaseAddDocumentsPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <PurchaseAddStep3 />
    </Suspense>
  );
}
