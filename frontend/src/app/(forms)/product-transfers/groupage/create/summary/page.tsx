"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { GroupageAddStep3 } from "@/features/product-transfer/presentation/components/Groupage/Add/GroupageAddStep3"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function SummaryPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <GroupageAddStep3 />
    </Suspense>
  )
}
