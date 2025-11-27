"use client";

import ProducerEdit from "@/features/actor/presentation/components/Producer/ProducerEdit";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProducerEditPage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <ProducerEdit />
    </Suspense>
  );
}
