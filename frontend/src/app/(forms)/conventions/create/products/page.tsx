"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionCreateStep2 } from "@/features/convention/presentation/components";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProductsPage() {
  const { t } = useTranslation(["common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ConventionCreateStep2 />
    </Suspense>
  );
}
