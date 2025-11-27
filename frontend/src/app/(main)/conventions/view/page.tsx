"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionViewContent } from "@/features/convention/presentation/components/ConventionViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ConventionViewPage: React.FC = () => {
  const { t } = useTranslation(["convention", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <ConventionViewContent />
    </Suspense>
  );
};

export default ConventionViewPage;
