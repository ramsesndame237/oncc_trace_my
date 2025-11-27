"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { StandardAddStep1 } from "@/features/product-transfer/presentation/components/Standard/Add/StandardAddStep1"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function GeneralInfoPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StandardAddStep1 />
    </Suspense>
  )
}
