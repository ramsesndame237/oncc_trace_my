"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionEdit } from "@/features/convention/presentation/components/ConventionEdit";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ConventionEditPage() {
  const { t } = useTranslation(["convention", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <ConventionEdit />
    </Suspense>
  );
}
