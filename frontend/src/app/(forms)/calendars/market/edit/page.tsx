"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { MarketEditForm } from "@/features/calendar/presentation/components/Market/Edit/MarketEditForm"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function MarketEditPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingEdit")} />}
    >
      <MarketEditForm />
    </Suspense>
  )
}
