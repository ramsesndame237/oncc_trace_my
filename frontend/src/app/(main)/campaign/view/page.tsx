"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { CampaignViewContent } from "@/features/campaign/presentation/components/CampaignViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const CampaignViewPage: React.FC = () => {
  const { t } = useTranslation(["campaign", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <CampaignViewContent />
    </Suspense>
  );
};

export default CampaignViewPage;
