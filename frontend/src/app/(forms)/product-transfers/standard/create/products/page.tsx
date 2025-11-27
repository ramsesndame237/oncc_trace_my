"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { StandardAddStep2 } from "@/features/product-transfer/presentation/components/Standard/Add/StandardAddStep2"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function ProductsPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StandardAddStep2 />
    </Suspense>
  )
}
