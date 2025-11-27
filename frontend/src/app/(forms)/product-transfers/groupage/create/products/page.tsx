"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { GroupageAddStep2 } from "@/features/product-transfer/presentation/components/Groupage/Add/GroupageAddStep2"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function ProductsPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <GroupageAddStep2 />
    </Suspense>
  )
}
