"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SaleAddStep1 } from "@/features/transaction/presentation/components/Sale/Add/SaleAddStep1";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SaleAddGeneralInfoPage() {
  const { t } = useTranslation("common");
  return (
    <Suspense
      fallback={<LoadingFallback message={t("messages.loadingView")} />}
    >
      <SaleAddStep1 />
    </Suspense>
  );
}
