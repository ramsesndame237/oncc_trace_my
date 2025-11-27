"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { MarketAddStep2 } from "@/features/calendar/presentation/components/Market/Add/MarketAddStep2"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function SummaryPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <MarketAddStep2 />
    </Suspense>
  )
}
