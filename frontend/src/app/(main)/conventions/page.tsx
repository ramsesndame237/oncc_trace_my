"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionList } from "@/features/convention/presentation/components/ConventionList";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ConventionsPage: React.FC = () => {
  const { t } = useTranslation("convention");
  const { t: tc } = useTranslation("common");

  return (
    <Suspense fallback={<LoadingFallback message={tc("messages.loading")} />}>
      <AppContent
        title={t("page.title")}
        icon={<Icon name="ConventionIcon" />}
        listContent
      >
        <ConventionList hiddenSearch={true} />
      </AppContent>
    </Suspense>
  );
};

export default ConventionsPage;
