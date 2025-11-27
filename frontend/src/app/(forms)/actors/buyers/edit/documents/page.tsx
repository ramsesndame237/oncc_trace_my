"use client";

import BuyerEditDocuments from "@/features/actor/presentation/components/Buyers/BuyerEditDocuments";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function BuyerEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <BuyerEditDocuments />
    </Suspense>
  );
}
