"use client";

import ProducerEditDocuments from "@/features/actor/presentation/components/Producer/ProducerEditDocuments";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ProducerEditDocuments />
    </Suspense>
  );
}
