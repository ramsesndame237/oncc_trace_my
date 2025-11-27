"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { MarketAddStep1 } from "@/features/calendar/presentation/components/Market/Add/MarketAddStep1"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function InformationsPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <MarketAddStep1 />
    </Suspense>
  )
}
