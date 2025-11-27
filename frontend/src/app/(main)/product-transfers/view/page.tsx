"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ProductTransferViewContent } from "@/features/product-transfer/presentation/components/ProductTransferViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProductTransferViewPage: React.FC = () => {
  const { t } = useTranslation(["productTransfer", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProductTransferViewContent />
    </Suspense>
  );
};

export default ProductTransferViewPage;
