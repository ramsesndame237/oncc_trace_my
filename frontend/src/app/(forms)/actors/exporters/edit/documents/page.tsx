"use client";

import ExporterEditDocuments from "@/features/actor/presentation/components/Exporters/ExporterEditDocuments";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ExporterEditDocumentsPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ExporterEditDocuments />
    </Suspense>
  );
}
