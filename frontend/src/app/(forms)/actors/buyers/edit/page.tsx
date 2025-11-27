"use client";

import BuyerEdit from "@/features/actor/presentation/components/Buyers/BuyerEdit";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyerEditPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <BuyerEdit />
    </Suspense>
  );
}
