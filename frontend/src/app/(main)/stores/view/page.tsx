"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { StoreViewContent } from "@/features/store/presentation/components/StoreViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const StoreViewPage: React.FC = () => {
  const { t } = useTranslation(["store", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <StoreViewContent />
    </Suspense>
  );
};

export default StoreViewPage;