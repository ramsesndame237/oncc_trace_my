"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionEditDocuments } from "@/features/convention/presentation/components/ConventionEditDocuments";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ConventionEditDocumentsPage() {
  const { t } = useTranslation(["convention", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <ConventionEditDocuments />
    </Suspense>
  );
}
