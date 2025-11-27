"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ProductTransferEditDocuments } from "@/features/product-transfer/presentation/components/ProductTransferEditDocuments";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ProductTransferEditDocumentsPage() {
  const { t } = useTranslation(["productTransfer", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <ProductTransferEditDocuments />
    </Suspense>
  );
}
