"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseAddStep1 } from "@/features/transaction/presentation/components/Purchase/Add/PurchaseAddStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function PurchaseAddGeneralInfoPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <PurchaseAddStep1 />
    </Suspense>
  );
}
