"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { StandardAddStep3 } from "@/features/product-transfer/presentation/components/Standard/Add/StandardAddStep3"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function DriverPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StandardAddStep3 />
    </Suspense>
  )
}
