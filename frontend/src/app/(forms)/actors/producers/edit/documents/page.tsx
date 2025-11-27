"use client";

import ProducersEditDocuments from "@/features/actor/presentation/components/Producers/ProducersEditDocuments";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducersEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ProducersEditDocuments />
    </Suspense>
  );
}
