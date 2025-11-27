"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { CalendarViewContent } from "@/features/calendar/presentation/components/CalendarViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const CalendarViewPage: React.FC = () => {
  const { t } = useTranslation(["calendar", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <CalendarViewContent />
    </Suspense>
  );
};

export default CalendarViewPage;
