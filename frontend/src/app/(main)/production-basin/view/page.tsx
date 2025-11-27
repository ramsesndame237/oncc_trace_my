"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ProductionBasinViewContent } from "@/features/production-basin/presentation/components/ProductionBasinViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProductionBasinViewPage: React.FC = () => {
  const { t } = useTranslation(["productionBasin", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ProductionBasinViewContent />
    </Suspense>
  );
};

export default ProductionBasinViewPage;
