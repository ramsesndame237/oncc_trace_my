"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { PickupEditForm } from "@/features/calendar/presentation/components/Pickup/Edit/PickupEditForm"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function PickupEditPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingEdit")} />}
    >
      <PickupEditForm />
    </Suspense>
  )
}
