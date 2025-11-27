"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { BuyersViewContent } from "@/features/actor/presentation/components/Buyers/BuyersViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const BuyersViewPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <BuyersViewContent />
    </Suspense>
  );
};

export default BuyersViewPage;
