"use client";

import TransformerEditDocuments from "@/features/actor/presentation/components/Transformers/TransformerEditDocuments";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function TransformerEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <TransformerEditDocuments />
    </Suspense>
  );
}
