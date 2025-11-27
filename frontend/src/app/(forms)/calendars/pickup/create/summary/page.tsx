"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { PickupAddStep2 } from "@/features/calendar/presentation/components/Pickup/Add/PickupAddStep2"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function SummaryPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <PickupAddStep2 />
    </Suspense>
  )
}
