"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { StandardAddStep5 } from "@/features/product-transfer/presentation/components/Standard/Add/StandardAddStep5"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function SummaryPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StandardAddStep5 />
    </Suspense>
  )
}
