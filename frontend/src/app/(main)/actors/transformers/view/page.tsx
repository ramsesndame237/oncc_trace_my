"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { TransformerViewContent } from "@/features/actor/presentation/components/Transformers/TransformerViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const TransformersViewPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <TransformerViewContent />
    </Suspense>
  );
};

export default TransformersViewPage;
