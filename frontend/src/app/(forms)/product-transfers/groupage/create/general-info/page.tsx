"use client"

import { LoadingFallback } from "@/components/modules/loading-fallback"
import { GroupageAddStep1 } from "@/features/product-transfer/presentation/components/Groupage/Add/GroupageAddStep1"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function GeneralInfoPage() {
  const { t } = useTranslation(["common"])

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <GroupageAddStep1 />
    </Suspense>
  )
}
