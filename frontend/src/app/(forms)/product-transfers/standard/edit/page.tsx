"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { StandardEditForm } from "@/features/product-transfer/presentation/components/Standard/Edit/StandardEditForm";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProductTransferEditPage: React.FC = () => {
  const { t } = useTranslation(["productTransfer", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingEdit")} />
      }
    >
      <StandardEditForm />
    </Suspense>
  );
};

export default ProductTransferEditPage;
