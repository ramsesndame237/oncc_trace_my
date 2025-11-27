"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { StandardAddStep4 } from "@/features/product-transfer/presentation/components/Standard/Add/StandardAddStep4"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function DocumentsPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StandardAddStep4 />
    </Suspense>
  )
}
